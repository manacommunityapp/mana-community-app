import { useState, useEffect, useMemo, useRef } from "react";
import { safeStorage } from "../../../utils/storage";
import { useParams, Link } from "react-router";
import { Loader2, MapPin, Clock, Filter, ChevronRight, ShieldAlert, CalendarIcon, Calendar, Plus, Edit2, Trash2, X, Search, Trophy, Play, Check, Activity, Download, ChevronDown, FileSpreadsheet, FileText, Printer, AlertCircle, Radio } from "lucide-react";
import { BasketballIcon, getSportIcon, getSportColor } from "./utils/sportsConstants";
import { format, parseISO } from "date-fns";
import { sportsService } from "../../../services/sports/sportsService";
import { sportsScheduleService, type EventListItem } from "../../../services/sports/sportsScheduleService";
import { venueService } from "../../../services/bookings/venueService";
import { useAuth } from "../../../contexts/AuthContext";
import type { SportsEvent, Venue, SportMeta } from "../../../types/api";
import { CREATE_EDIT_SPORTS_MAIN } from "../../../constants/permissions";
import { showSuccess, showWarning, showError, showInfo } from "../../../utils/ToastUtils";
import { confirmAction } from "../../../utils/AlertUtils";
import { TIME_OPTIONS } from "../../../constants/timeOptions";
import { DatePicker } from "../ui/date-picker";
import { TimePicker } from "../ui/time-picker";
import { exportScheduleToCSV, exportScheduleToExcel, exportScheduleToPDF, exportUmpireScorecardsPDF } from "../../../utils/sportsExportUtils";
import "./SportsAuction.css";

const toast = {
  success: (msg: string) => showSuccess(msg),
  warning: (msg: string) => showWarning(msg),
  error: (msg: string) => showError(msg),
  info: (msg: string) => showInfo(msg),
};

import { TournamentScheduler } from "../scheduler/TournamentScheduler";
import { SetupSchedule } from "../scheduler/SetupSchedule";
import { ManualScheduler } from "../scheduler/ManualScheduler";
import { tournamentService, type ConfigInfo } from "../../../services/sports/tournamentService";
import { MatchDetailView } from "./MatchDetailView";
import { LiveMatchView } from "./LiveMatchView";
import { LiveScoringPanel } from "./LiveScoringPanel";
import { GenericMatchDetailView } from "./GenericMatchDetailView";
import { GenericLiveMatchView } from "./GenericLiveMatchView";
import { GenericLiveScoringPanel } from "./GenericLiveScoringPanel";
import { isCricketSport, getSportType, isTimeSport } from "./utils/sportScoringConstants";
import { Leaderboard } from "./Leaderboard";
import { GenericLeaderboard } from "./GenericLeaderboard";
import { RaceScoringPanel } from "./RaceScoringPanel";
import { RaceResultsView } from "./RaceResultsView";
import { TournamentSponsorBanner, DEFAULT_TOURNAMENT_SPONSORS } from "./sponsors";
import { TeamsHubShowcase } from "./teams";

const TABS = ["Overview", "My Matches", "All Events", "Teams & Squads", "Leaderboard", "Brackets", "Config", "Setup Schedule", "Manual"] as const;
type Tab = typeof TABS[number];




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
  id: number;
  date: string;
  endDate: string;
  time: string;
  sport: string;
  name: string;
  venue: string;
  venueCity: string;
  category: string;
  status: string;
  statusColor: string;
}


function MyMatchCard({ item }: { item: ScheduleEntry }) {
  const SportIcon = getSportIcon(item.sport);
  const sportColors = getSportColor(item.sport);
  const statusLabel = item.status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()) || "Registered";
  const statusTone = item.statusColor === "#10b981"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
    : item.statusColor === "#6366f1"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-600/15"
      : "bg-amber-50 text-amber-700 ring-amber-600/15";

  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border" style={{ backgroundColor: sportColors.bg, borderColor: `${sportColors.color}25`, color: sportColors.color }}>
            <SportIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: sportColors.color }}>{item.sport}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${statusTone}`}>{statusLabel}</span>
            </div>
            <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">{item.name}</h3>
            <p className="mt-1 text-xs text-slate-500">{item.category}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:w-[310px] sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <div className="flex items-start gap-2">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800">{item.date ? safeFormatDate(item.date, "EEE, d MMM yyyy") : "Date to be announced"}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{item.time || "Time to be announced"}{item.endDate && item.endDate.slice(0, 10) !== item.date.slice(0, 10) ? ` · until ${safeFormatDate(item.endDate, "d MMM")}` : ""}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">{item.venue}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{item.venueCity || "Community venue"}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
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
        <div className="text-xs mt-0.5" style={{ color: "#6b7094" }}>{match.date} | {match.time}</div>
        {isByeMatch && <div className="text-xs text-emerald-600 font-bold mt-1">BYE</div>}
      </div>
      <div className="px-3 py-3 space-y-2.5 text-left">
        {players.map((p, i) => (
          <div key={i}>
            <div className="flex items-center gap-2">
              {p.isTBD ? (
                <div className="w-7 h-7 rounded-full border border-dashed border-slate-300 shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-slate-500">{p.initials}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className={`text-xs truncate ${p.isTBD ? "text-slate-400 italic" : "text-slate-800 font-semibold"}`}>
                  {p.fullName}
                </div>
                {p.flatNumber && !p.isTBD && (
                  <div className="text-xs text-slate-500">{p.flatNumber}</div>
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
          <span className="text-[10px] font-bold text-slate-500">{match.venue.initials}</span>
        </div>
        <span className="text-[10px] truncate" style={{ color: "#6b7094" }}>{match.venue.name}</span>
      </div>
    </div>
  );
}

function BracketView({ eventId, tournamentConfigs, initialConfigId }: { eventId?: string; tournamentConfigs: ConfigInfo[]; initialConfigId?: number | null }) {
  const [rounds, setRounds] = useState<BracketRound[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(initialConfigId ?? null);
  const [bracketMatches, setBracketMatches] = useState<any[]>([]);

  useEffect(() => {
    if (initialConfigId) {
      setSelectedConfigId(initialConfigId);
    } else if (tournamentConfigs.length > 0 && !selectedConfigId) {
      setSelectedConfigId(tournamentConfigs[0].id);
    }
  }, [tournamentConfigs, initialConfigId, selectedConfigId]);

  useEffect(() => {
    if (selectedConfigId) {
      setLoading(true);
      tournamentService.getMatchesByConfigId(selectedConfigId)
        .then(matches => {
          setBracketMatches(matches);
          const matchesBySport = matches.filter(m => m.status !== "BYE");
          if (matchesBySport.length > 0) {
            const roundMap = new Map<string, any[]>();
            for (const m of matchesBySport) {
              const roundName = m.roundName || "Round 1";
              if (!roundMap.has(roundName)) roundMap.set(roundName, []);
              roundMap.get(roundName)!.push(m);
            }
            const generatedRounds: BracketRound[] = Array.from(roundMap.entries()).map(([name, rMatches]) => ({
              name,
              matches: rMatches.map((m, idx) => ({
                id: `M-${m.matchId}`,
                label: `${name} #${m.matchNumber || idx + 1}`,
                date: m.scheduledAt ? safeFormatDate(m.scheduledAt.split("T")[0], "MMM dd") : "—",
                time: m.scheduledAt ? safeFormatDate(m.scheduledAt, "hh:mm a") : "—",
                p1: m.teamAName ? { initials: getPlayerInitials(m.teamAName), fullName: m.teamAName } : null,
                p2: m.teamBName ? { initials: getPlayerInitials(m.teamBName), fullName: m.teamBName } : null,
                venue: { initials: m.venueName ? m.venueName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 3) : "TBD", name: m.venueName || "TBD" },
                isBye: !m.teamAName || !m.teamBName,
              })),
            }));
            setRounds(generatedRounds);
          } else {
            setRounds([]);
          }
        })
        .catch(() => setRounds([]))
        .finally(() => setLoading(false));
      return;
    }

    if (!eventId) { setRounds([]); return; }

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
  }, [eventId, selectedConfigId]);

  return (
    <div className="space-y-4">
      {/* Tournament Selector */}
      {tournamentConfigs.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Tournament</label>
              <select
                value={selectedConfigId ?? ""}
                onChange={e => setSelectedConfigId(e.target.value ? Number(e.target.value) : null)}
                className="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 focus:ring-2 focus:ring-indigo-300 outline-none text-slate-800"
              >
                {tournamentConfigs.map(c => (
                  <option key={c.id} value={c.id}>{c.tournamentName} — {c.eventName}</option>
                ))}
              </select>
            </div>
            {selectedConfigId && (
              <div className="text-xs text-slate-500 sm:pt-4">
                {(() => {
                  const cfg = tournamentConfigs.find(c => c.id === selectedConfigId);
                  return cfg ? `${cfg.tournamentType} · ${cfg.totalTeams} teams` : "";
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#f97316] animate-spin" /></div>
      ) : rounds.length === 0 ? (
        <div className="rounded-xl p-6 text-center"
          style={{
            background: "white",
            border: "1px solid rgba(99, 102, 241, 0.12)",
            boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
          }}
        >
          <p className="text-sm text-[#6b7094]">
            {tournamentConfigs.length === 0
              ? "No tournaments configured yet. Create a tournament from the Config tab to see brackets."
              : "No matches found for this tournament. Generate a schedule first."}
          </p>
        </div>
      ) : (
        <>
          {rounds.map(round => (
            <div key={round.name}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-bold text-[#f97316] uppercase tracking-wider">{round.name}</span>
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
              <span className="text-[10px] font-bold text-[#f97316] uppercase tracking-wider">Results</span>
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
                  <span className="text-[10px]">{r.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">{r.label}</div>
                    <div className="text-sm text-[#6b7094] italic mt-0.5">{r.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
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
  const { user, hasPermission, isAdmin: authIsAdmin, isSuperAdmin, isSportsAdmin } = useAuth();
  const isAdmin = isSuperAdmin || authIsAdmin || isSportsAdmin || (hasPermission ? hasPermission(CREATE_EDIT_SPORTS_MAIN) : false);

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (eventId && isAdmin) return "Setup Schedule";
    return "Overview";
  });
  const [allEvents, setAllEvents] = useState<EventListItem[]>([]);
  const [myMatches, setMyMatches] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ totalGames: number; liveNow: number; upcoming: number; completed: number } | null>(null);

  const fetchScheduleStats = () => {
    sportsService.getScheduleStats()
      .then(res => setStats(res))
      .catch(err => console.error("Failed to load schedule stats:", err));
  };

  // ─── Fixtures / Schedule state & handlers ───
  const [fixturesList, setFixturesList] = useState<{ id: number; matchId?: number; teamAId?: number; teamBId?: number; name: string; sport: string; venue: string; date: string; time: string; status: string; team1: string; team2: string; score1: string; score2: string; rawStartDate?: string | null; rawEndDate?: string | null }[]>([]);
  const [showFixtureForm, setShowFixtureForm] = useState(false);
  const [editingFixtureId, setEditingFixtureId] = useState<number | null>(null);
  const [fixtureName, setFixtureName] = useState("");
  const [fixtureSport, setFixtureSport] = useState("");
  const [fixtureVenue, setFixtureVenue] = useState("");
  const [fixtureDate, setFixtureDate] = useState("");
  const [fixtureTime, setFixtureTime] = useState("");
  const [fixtureTeam1, setFixtureTeam1] = useState("");
  const [fixtureTeam2, setFixtureTeam2] = useState("");
  const [fixtureStatus, setFixtureStatus] = useState("SCHEDULED");
  const [fixtureScore1, setFixtureScore1] = useState("");
  const [fixtureScore2, setFixtureScore2] = useState("");
  const [fixtureSearchQuery, setFixtureSearchQuery] = useState("");
  const [fixtureSportFilter, setFixtureSportFilter] = useState("All");
  const [fixtureDateFilter, setFixtureDateFilter] = useState<string | null>(null);

  const [confirmGoLiveFixture, setConfirmGoLiveFixture] = useState<any | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoringFixtureId, setScoringFixtureId] = useState<number | null>(null);
  const [viewingMatchId, setViewingMatchId] = useState<number | null>(null);
  const [liveViewMatchId, setLiveViewMatchId] = useState<number | null>(null);
  const [liveScoringMatchId, setLiveScoringMatchId] = useState<number | null>(null);
  const [activeMatchSport, setActiveMatchSport] = useState<string>("");
  const [activeMatchFixture, setActiveMatchFixture] = useState<{ teamAId?: number; teamBId?: number; team1: string; team2: string } | null>(null);

  const openLiveView = (fixture: { matchId?: number; sport: string; teamAId?: number; teamBId?: number; team1: string; team2: string }) => {
    if (!fixture.matchId) return;
    setActiveMatchSport(fixture.sport);
    setActiveMatchFixture({ teamAId: fixture.teamAId, teamBId: fixture.teamBId, team1: fixture.team1, team2: fixture.team2 });
    setLiveViewMatchId(fixture.matchId);
  };

  const openMatchDetail = (fixture: { matchId?: number; sport: string; teamAId?: number; teamBId?: number; team1: string; team2: string }) => {
    if (!fixture.matchId) return;
    setActiveMatchSport(fixture.sport);
    setActiveMatchFixture({ teamAId: fixture.teamAId, teamBId: fixture.teamBId, team1: fixture.team1, team2: fixture.team2 });
    setViewingMatchId(fixture.matchId);
  };

  const openLiveScoring = (fixture: { matchId?: number; sport: string; teamAId?: number; teamBId?: number; team1: string; team2: string }) => {
    if (!fixture.matchId) return;
    setActiveMatchSport(fixture.sport);
    setActiveMatchFixture({ teamAId: fixture.teamAId, teamBId: fixture.teamBId, team1: fixture.team1, team2: fixture.team2 });
    setLiveScoringMatchId(fixture.matchId);
  };

  const activeIsCricket = isCricketSport(activeMatchSport);
  const activeIsTimeSport = isTimeSport(activeMatchSport);
  const activeSportType = getSportType(activeMatchSport) || "BADMINTON";

  const [venues, setVenues] = useState<Venue[]>([]);
  const [sportsMeta, setSportsMeta] = useState<SportMeta[]>([]);

  // ─── Tournament & Event selectors ───
  const [tournamentConfigs, setTournamentConfigs] = useState<ConfigInfo[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>("All");
  const [fixtureStatusFilter, setFixtureStatusFilter] = useState<string>("All");
  const [leaderboardViewType, setLeaderboardViewType] = useState<"auto" | "cricket" | "generic">("auto");

  const metaLoadedRef = useRef(false);
  const needsMeta = activeTab === "Overview" || activeTab === "Setup Schedule" || activeTab === "Config" || activeTab === "Manual" || activeTab === "All Events" || activeTab === "My Matches";
  useEffect(() => {
    if (metaLoadedRef.current || !needsMeta) return;
    metaLoadedRef.current = true;
    venueService.getVenues(user?.communityId ?? null).then(setVenues).catch(() => {});
    sportsService.getSportsMeta().then(setSportsMeta).catch(() => {});
  }, [user?.communityId, needsMeta]);

  useEffect(() => {
    tournamentService.getConfigs()
      .then(cfgs => {
        setTournamentConfigs(cfgs);
      })
      .catch(() => {});
  }, []);

  const handleFixtureSave = () => {
    if (!fixtureName.trim() || !fixtureSport || !fixtureVenue || !fixtureDate || !fixtureTime || !fixtureTeam1 || !fixtureTeam2) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingFixtureId !== null) {
      setFixturesList(prev => prev.map(f => f.id === editingFixtureId ? {
        ...f,
        name: fixtureName,
        sport: fixtureSport,
        venue: fixtureVenue,
        date: fixtureDate,
        time: fixtureTime,
        team1: fixtureTeam1,
        team2: fixtureTeam2,
        status: fixtureStatus,
        score1: fixtureScore1,
        score2: fixtureScore2
      } : f));
      toast.success("Fixture updated successfully");
    } else {
      const newFixture = {
        id: Date.now(),
        name: fixtureName,
        sport: fixtureSport,
        venue: fixtureVenue,
        date: fixtureDate,
        time: fixtureTime,
        team1: fixtureTeam1,
        team2: fixtureTeam2,
        status: fixtureStatus,
        score1: fixtureScore1,
        score2: fixtureScore2
      };
      setFixturesList(prev => [...prev, newFixture]);
      toast.success("Fixture added successfully");
    }

    resetFixtureForm();
    fetchScheduleStats();
  };

  const handleFixtureEdit = (f: any) => {
    setEditingFixtureId(f.id);
    setFixtureName(f.name);
    setFixtureSport(f.sport);
    setFixtureVenue(f.venue);
    setFixtureDate(f.date);
    setFixtureTime(f.time);
    setFixtureTeam1(f.team1);
    setFixtureTeam2(f.team2);
    setFixtureStatus(f.status);
    setFixtureScore1(f.score1);
    setFixtureScore2(f.score2);
    setShowFixtureForm(true);
  };

  const handleFixtureDelete = async (id: number) => {
    const confirmed = await confirmAction(
      "Delete Fixture",
      "Are you sure you want to delete this fixture?"
    );
    if (!confirmed) return;
    setFixturesList(prev => prev.filter(f => f.id !== id));
    toast.success("Fixture deleted successfully");
    fetchScheduleStats();
  };

  const [scoreSaving, setScoreSaving] = useState(false);
  const [scoreWinnerId, setScoreWinnerId] = useState<number | null>(null);
  const [scoreResultType, setScoreResultType] = useState("WIN");
  const [scoreMatchNotes, setScoreMatchNotes] = useState("");

  const handleScoreUpdateSubmit = async () => {
    if (scoringFixtureId === null) return;
    const fixture = fixturesList.find(f => f.id === scoringFixtureId);
    if (!fixture) return;

    if (fixture.matchId) {
      setScoreSaving(true);
      try {
        const winnerId = scoreResultType === "TIE" || scoreResultType === "DRAW" || scoreResultType === "NO_RESULT"
          ? null : scoreWinnerId;
        await tournamentService.recordResult({
          matchId: fixture.matchId,
          winnerTeamId: winnerId ?? undefined,
          scoreTeamA: fixtureScore1,
          scoreTeamB: fixtureScore2,
          matchNotes: scoreMatchNotes || undefined,
        });
        toast.success("Match result saved!");
      } catch (e: any) {
        toast.error(e?.message || "Failed to save result");
        setScoreSaving(false);
        return;
      }
      setScoreSaving(false);
    }

    setFixturesList(prev => prev.map(f => f.id === scoringFixtureId ? {
      ...f, score1: fixtureScore1, score2: fixtureScore2, status: "COMPLETED"
    } : f));
    setShowScoreModal(false);
    setScoringFixtureId(null);
    setFixtureScore1("");
    setFixtureScore2("");
    setScoreWinnerId(null);
    setScoreResultType("WIN");
    setScoreMatchNotes("");
    fetchScheduleStats();
  };

  const resetFixtureForm = () => {
    setEditingFixtureId(null);
    setFixtureName("");
    setFixtureSport("");
    setFixtureVenue("");
    setFixtureDate("");
    setFixtureTime("");
    setFixtureTeam1("");
    setFixtureTeam2("");
    setFixtureStatus("SCHEDULED");
    setFixtureScore1("");
    setFixtureScore2("");
    setShowFixtureForm(false);
  };

  const fixtureDates = useMemo(() => {
    const dates = new Set<string>();
    for (const f of fixturesList) {
      if (f.date) {
        try { dates.add(format(new Date(f.date), "yyyy-MM-dd")); } catch {}
      }
    }
    return Array.from(dates).sort();
  }, [fixturesList]);

  const filteredFixtures = useMemo(() => {
    return fixturesList.filter(f => {
      const searchStr = `${f.name} ${f.team1} ${f.team2} ${f.venue}`.toLowerCase();
      const matchesSearch = searchStr.includes(fixtureSearchQuery.toLowerCase());
      const matchesSport = fixtureSportFilter === "All" || f.sport.toLowerCase().includes(fixtureSportFilter.toLowerCase());
      const matchesStatus = fixtureStatusFilter === "All" || f.status === fixtureStatusFilter;
      const matchesTournament = selectedTournamentId === null || f.name.includes(
        tournamentConfigs.find(c => c.id === selectedTournamentId)?.tournamentName || ""
      );
      let matchesDate = true;
      if (fixtureDateFilter) {
        try { matchesDate = format(new Date(f.date), "yyyy-MM-dd") === fixtureDateFilter; } catch { matchesDate = false; }
      }
      return matchesSearch && matchesSport && matchesStatus && matchesTournament && matchesDate;
    });
  }, [fixturesList, fixtureSearchQuery, fixtureSportFilter, fixtureStatusFilter, selectedTournamentId, tournamentConfigs, fixtureDateFilter]);

  const sortedFixtures = useMemo(() => {
    const statusWeight = { LIVE: 0, SCHEDULED: 1, COMPLETED: 2 };
    return [...filteredFixtures].sort((a, b) => {
      const weightA = statusWeight[a.status as keyof typeof statusWeight] ?? 99;
      const weightB = statusWeight[b.status as keyof typeof statusWeight] ?? 99;
      if (weightA !== weightB) return weightA - weightB;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [filteredFixtures]);

  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const renderExportDropdown = (customList?: typeof fixturesList) => {
    const targetMatches = customList || (sortedFixtures.length > 0 ? sortedFixtures : fixturesList);
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setShowExportDropdown(!showExportDropdown)}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600" />
          <span>Export Schedule</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {showExportDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowExportDropdown(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-left text-xs animate-fade-in-up">
              <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Fixtures & Scores ({targetMatches.length})
              </div>
              <button
                type="button"
                onClick={() => {
                  exportScheduleToExcel(targetMatches, "Tournament Match Schedule");
                  setShowExportDropdown(false);
                }}
                className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Download Excel (.xls)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  exportScheduleToCSV(targetMatches, "Tournament Match Schedule");
                  setShowExportDropdown(false);
                }}
                className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Download CSV (.csv)</span>
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                type="button"
                onClick={() => {
                  exportScheduleToPDF(targetMatches, "Tournament Match Schedule", user?.communityName || "Community Sports");
                  setShowExportDropdown(false);
                }}
                className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Print Fixtures Sheet PDF</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  exportUmpireScorecardsPDF(targetMatches, "Match Scorecards");
                  setShowExportDropdown(false);
                }}
                className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4 text-amber-600" />
                <span>Print Referee Scorecards PDF</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (!user?.userId) return;
    setLoading(true);

    if (activeTab === "My Matches") {
      sportsScheduleService.getMyRegistrations()
        .then(response => {
          const registrations = Array.isArray(response)
            ? response
            : Array.isArray((response as any)?.data)
              ? (response as any).data
              : Array.isArray((response as any)?.content)
                ? (response as any).content
                : [];
          const activeRegistrations = registrations.filter((registration: any) =>
            !["WITHDRAWN", "CANCELLED", "REJECTED"].includes(String(registration.status ?? "").toUpperCase())
          );
          const registeredEvents = new Map<string, ScheduleEntry>();

          activeRegistrations.forEach((registration: any) => {
            const eventName = registration.eventName ?? registration.event?.name ?? "Sports event";
            const sport = registration.sportName ?? registration.event?.sportName ?? "Other";
            const eventKey = registration.eventId != null
              ? String(registration.eventId)
              : `${sport.toLowerCase()}:${eventName.toLowerCase()}`;
            if (registeredEvents.has(eventKey)) return;

            const status = String(registration.status ?? "REGISTERED").toUpperCase();
            registeredEvents.set(eventKey, {
              id: Number(registration.eventId ?? registration.id),
              date: registration.eventDateStart ?? registration.event?.eventDateStart ?? "",
              endDate: registration.eventDateEnd ?? registration.event?.eventDateEnd ?? "",
              time: registration.startTime ?? registration.event?.startTime ?? "",
              sport,
              name: eventName,
              venue: registration.venueName ?? registration.event?.venueName ?? "TBD",
              venueCity: registration.venueCity ?? registration.event?.venueCity ?? "",
              category: registration.categoryName ?? registration.category?.name ?? "General category",
              status,
              statusColor: status === "CONFIRMED" || status === "REGISTERED" ? "#10b981" : "#f97316",
            });
          });

          setMyMatches(Array.from(registeredEvents.values()));
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    } else if (activeTab === "All Events" || activeTab === "Overview") {
      fetchScheduleStats();
      const eventsPromise = user?.communityId
        ? sportsScheduleService.getOpenEvents(user.communityId)
        : sportsScheduleService.getAllOpenEvents().catch(() => []);
      const configsPromise = tournamentService.getConfigs().catch(() => []);

      Promise.all([eventsPromise, configsPromise])
        .then(async ([events, configs]) => {
          setAllEvents(events);

          const eventFixtures = (events || []).map((ev): any => {
            const isLive = ev.registrationStatus === "LIVE";
            const isCompleted = ev.registrationStatus === "COMPLETED";
            const status = isLive ? "LIVE" : isCompleted ? "COMPLETED" : "SCHEDULED";

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

            const eventDate = ev.eventDateStart ? ev.eventDateStart.split("T")[0] : "";
            let eventTime = "12:00 PM";
            try {
              if (ev.eventDateStart) {
                eventTime = format(new Date(ev.eventDateStart), "hh:mm a");
              }
            } catch (e) {}

            return {
              id: ev.id,
              name: ev.name,
              sport: ev.sportName || "Other",
              venue: ev.venueName || "TBD",
              date: eventDate,
              time: eventTime,
              status,
              team1: homeTeam,
              team2: awayTeam,
              score1: "",
              score2: "",
              rawStartDate: ev.eventDateStart,
              rawEndDate: ev.eventDateEnd,
            };
          });

          const matchFixtures: any[] = [];
          for (const cfg of configs || []) {
            try {
              const matches = await tournamentService.getMatchesByConfigId(cfg.id);
              for (const m of matches) {
                if (m.status === "BYE") continue;
                const scheduledDate = m.scheduledAt ? m.scheduledAt.split("T")[0] : "";
                let scheduledTime = "";
                try {
                  if (m.scheduledAt) scheduledTime = format(new Date(m.scheduledAt), "hh:mm a");
                } catch (_e) {}

                matchFixtures.push({
                  id: -(m.matchId ?? 0),
                  matchId: m.matchId,
                  teamAId: m.teamAId,
                  teamBId: m.teamBId,
                  name: `${cfg.tournamentName} — ${m.roundName} #${m.matchNumber}`,
                  sport: cfg.eventName || "Tournament",
                  venue: m.venueName || "TBD",
                  date: scheduledDate,
                  time: scheduledTime,
                  status: m.status === "COMPLETED" ? "COMPLETED" : m.status === "IN_PROGRESS" ? "LIVE" : "SCHEDULED",
                  team1: m.teamAName || "TBD",
                  team2: m.teamBName || "TBD",
                  score1: m.scoreTeamA || "",
                  score2: m.scoreTeamB || "",
                  rawStartDate: m.scheduledAt || cfg.startDate,
                  rawEndDate: cfg.endDate,
                });
              }
            } catch (_e) {}
          }

          setFixturesList([...eventFixtures, ...matchFixtures]);
        })
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
            className={`nav-item ${activeTab === "Overview" ? "active" : ""}`}
            onClick={() => setActiveTab("Overview")}
          >
            <div className="nav-dot"></div>Overview
          </button>
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
            className={`nav-item ${activeTab === "Teams & Squads" ? "active" : ""}`}
            onClick={() => setActiveTab("Teams & Squads")}
          >
            <div className="nav-dot"></div>Teams & Squads
          </button>
          <button
            className={`nav-item ${activeTab === "Leaderboard" ? "active" : ""}`}
            onClick={() => setActiveTab("Leaderboard")}
          >
            <div className="nav-dot"></div>Leaderboard
          </button>
          <button
            className={`nav-item ${activeTab === "Brackets" ? "active" : ""}`}
            onClick={() => setActiveTab("Brackets")}
          >
            <div className="nav-dot"></div>Brackets
          </button>
        </div>
        {isAdmin && (
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
        )}
      </aside>

      <main className="main-content">
        <div className="page active">
          <div className="page-hdr flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="page-title">{activeTab === "Overview" ? "Sports overview" : activeTab}</div>
              <div className="page-sub">{activeTab === "Overview" ? "Your community sports schedule, live matches and latest results." : "Sports scheduling & event matches"}</div>
            </div>
            {activeTab !== "My Matches" && fixturesList.length > 0 && <div className="self-start sm:self-auto">{renderExportDropdown()}</div>}
          </div>

      {/* Overview */}
      {activeTab === "Overview" && (
        <div className="space-y-3 sm:space-y-6 animate-fade-in-up text-left">
          {/* Tournament Sponsors Banner */}
          <TournamentSponsorBanner
            sponsors={DEFAULT_TOURNAMENT_SPONSORS}
            variant="compact"
          />

          {/* Tournament & Sport Event Quick Selector */}
          {tournamentConfigs.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Active tournaments</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Choose a tournament to view its fixtures</p>
                </div>
              </div>
              <label className="relative block w-full sm:max-w-sm">
                <span className="sr-only">Select a tournament</span>
                <select
                  value={selectedTournamentId ?? ""}
                  onChange={e => {
                    const tournamentId = Number(e.target.value);
                    if (!tournamentId) return;
                    setSelectedTournamentId(tournamentId);
                    setActiveTab("All Events");
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm font-semibold text-slate-800 outline-none transition hover:border-indigo-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select a tournament…</option>
                  {tournamentConfigs.map(cfg => (
                    <option key={cfg.id} value={cfg.id}>
                      {cfg.tournamentName} · {cfg.eventName || "Sport"} · {cfg.totalTeams} teams
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </label>
              {selectedTournamentId && (
                <button
                  onClick={() => setSelectedTournamentId(null)}
                  className="self-start text-xs font-semibold text-slate-500 transition hover:text-indigo-600 sm:self-auto"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total matches</span>
                <div className="p-1 sm:p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{stats?.totalGames ?? fixturesList.length}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-bold uppercase tracking-wider">Fixtures</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Live Now</span>
                <div className="p-1 sm:p-1.5 bg-red-50 text-red-600 rounded-lg">
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                  {stats?.liveNow ?? fixturesList.filter(f => f.status === "LIVE").length}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold uppercase tracking-wider animate-pulse">LIVE</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
                <div className="p-1 sm:p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                  {stats?.completed ?? fixturesList.filter(f => f.status === "COMPLETED").length}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold uppercase tracking-wider">Done</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Upcoming</span>
                <div className="p-1 sm:p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{stats?.upcoming ?? fixturesList.filter(f => f.status === "SCHEDULED").length}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-bold uppercase tracking-wider">Scheduled</span>
              </div>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Left Column: Live Matches & Navigation */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-6">
              {/* Ongoing Matches Section */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 m-0">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                    Live Matches
                  </h3>
                  <button onClick={() => setActiveTab("All Events")} className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">
                    View all <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {fixturesList.filter(f => f.status === "LIVE").length === 0 ? (
                    <div className="text-center py-5 sm:py-8 text-slate-400 text-xs">
                      No live matches running at the moment.
                    </div>
                  ) : (
                    fixturesList.filter(f => f.status === "LIVE").map((fixture) => {
                      const IconComponent = getSportIcon(fixture.sport);
                      const colors = getSportColor(fixture.sport);
                      return (
                        <div key={fixture.id} className="p-2 sm:p-4 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl flex items-center justify-between active:scale-[0.98] transition-all duration-150">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2.5 rounded-lg" style={{ backgroundColor: colors.bg, color: colors.color }}>
                              <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{fixture.sport}</p>
                              <h4 className="text-sm font-bold text-slate-800 leading-snug">{fixture.team1} vs {fixture.team2}</h4>
                              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[160px] sm:max-w-[220px]">{fixture.venue}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200/60 shadow-sm font-mono text-xs sm:text-sm font-bold text-slate-800">
                            <span>{fixture.score1 || "0"}</span>
                            <span className="text-slate-300">-</span>
                            <span>{fixture.score2 || "0"}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 m-0">
                  Quick Navigation
                </h3>
                <div className="flex overflow-x-auto gap-2 sm:grid sm:grid-cols-3 sm:gap-4 pb-1 sm:pb-0 -mx-0.5 px-0.5 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-hide">
                  <div
                    onClick={() => setActiveTab("My Matches")}
                    className="min-w-[145px] sm:min-w-0 snap-start shrink-0 sm:shrink p-3.5 sm:p-4 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200/70 hover:border-indigo-200 transition-all duration-150 cursor-pointer text-left space-y-2 group"
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">My Matches</h4>
                    <p className="text-xs text-slate-500 leading-relaxed hidden sm:block">Check matches registered for your personal schedule.</p>
                  </div>

                  <div
                    onClick={() => setActiveTab("All Events")}
                    className="min-w-[145px] sm:min-w-0 snap-start shrink-0 sm:shrink p-3.5 sm:p-4 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200/70 hover:border-indigo-200 transition-all duration-150 cursor-pointer text-left space-y-2 group"
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                      <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">All Fixtures</h4>
                    <p className="text-xs text-slate-500 leading-relaxed hidden sm:block">Browse, search and configure overall match listings.</p>
                  </div>

                  <div
                    onClick={() => setActiveTab("Brackets")}
                    className="min-w-[145px] sm:min-w-0 snap-start shrink-0 sm:shrink p-3.5 sm:p-4 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200/70 hover:border-indigo-200 transition-all duration-150 cursor-pointer text-left space-y-2 group"
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-200">
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Brackets</h4>
                    <p className="text-xs text-slate-500 leading-relaxed hidden sm:block">View elimination rounds, quarter, and semifinals.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Recent Results & Timeline */}
            <div className="space-y-3 sm:space-y-6">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 m-0">
                  Recent Results
                </h3>
                <div className="space-y-2.5 sm:space-y-3.5">
                  {fixturesList.filter(f => f.status === "COMPLETED").length === 0 ? (
                    <div className="text-center py-5 sm:py-8 text-slate-400 text-xs">
                      No completed matches found.
                    </div>
                  ) : (
                    fixturesList.filter(f => f.status === "COMPLETED").slice(0, 4).map((fixture) => {
                      const IconComponent = getSportIcon(fixture.sport);
                      const colors = getSportColor(fixture.sport);
                      const score1 = Number(fixture.score1 || 0);
                      const score2 = Number(fixture.score2 || 0);
                      return (
                        <div key={fixture.id} className="text-left space-y-1.5 sm:space-y-2 pb-2.5 sm:pb-3.5 border-b border-slate-100 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <IconComponent className="w-2.5 h-2.5 sm:w-3 sm:h-3" style={{ color: colors.color }} />
                              {fixture.sport}
                            </span>
                            <span>{fixture.date}</span>
                          </div>
                          <div className="space-y-0.5 sm:space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${score1 > score2 ? "font-bold text-slate-800" : "text-slate-600"}`}>{fixture.team1}</span>
                              <span className={`text-xs font-mono font-bold ${score1 > score2 ? "text-slate-800" : "text-slate-500"}`}>{score1}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${score2 > score1 ? "font-bold text-slate-800" : "text-slate-600"}`}>{fixture.team2}</span>
                              <span className={`text-xs font-mono font-bold ${score2 > score1 ? "text-slate-800" : "text-slate-500"}`}>{score2}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick Info Box */}
              <div className="bg-indigo-50/70 rounded-2xl p-4 sm:p-5 border border-indigo-100 text-left space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Administrative Note</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  If you are an organizer, use the operations panel (Config, Setup Schedule, Manual) to run automated round robin schedulers or create custom matches. Match results are synchronized live.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Matches */}
      {activeTab === "My Matches" && (
        <div className="space-y-4 sm:space-y-5 animate-fade-in-up text-left">
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-800 p-4 text-white shadow-lg sm:rounded-3xl sm:px-6 sm:py-4">
            <div className="pointer-events-none absolute -right-4 -top-8 opacity-10"><Trophy className="h-28 w-28 rotate-12" /></div>
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-white sm:text-base">
                <Calendar className="h-4 w-4 shrink-0 text-indigo-200" />
                <span className="truncate">Sports calendar</span>
              </div>
              <label className="relative z-10 flex w-[min(62%,16rem)] shrink-0 items-center gap-2 sm:w-64">
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-indigo-100/80 sm:text-xs">My Sports</span>
                <span className="relative block min-w-0 flex-1">
                  <select
                    value={selectedSportFilter}
                    onChange={e => setSelectedSportFilter(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-white/20 bg-white/10 py-2 pl-2.5 pr-8 text-xs font-semibold text-white outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/20 sm:min-w-40 sm:text-sm [&>option]:text-slate-900"
                    aria-label="My sports"
                  >
                    <option value="All">All sports</option>
                    {Array.from(new Set(myMatches.map(match => match.sport))).filter(Boolean).sort((a, b) => a.localeCompare(b)).map(sport => <option key={sport} value={sport}>{sport}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-100" />
                </span>
              </label>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">My events</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{myMatches.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sports</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{new Set(myMatches.map(match => match.sport)).size}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 shadow-sm sm:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Showing</p>
              <p className="mt-1 text-sm font-bold text-indigo-950">{selectedSportFilter === "All" ? "All registered sports" : selectedSportFilter}</p>
            </div>
          </div>

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Your schedule</h3>
                <p className="mt-0.5 text-xs text-slate-500">{loading ? "Loading your registered events…" : "Event details and venue information"}</p>
              </div>
              {!loading && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{myMatches.filter(item => selectedSportFilter === "All" || item.sport === selectedSportFilter).length} events</span>}
            </div>
            {loading ? (
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /><span className="ml-2 text-sm text-slate-500">Loading your matches</span></div>
            ) : myMatches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500"><CalendarIcon className="h-6 w-6" /></div>
                <h4 className="mt-4 text-sm font-bold text-slate-900">No registered events yet</h4>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">When you register for a sports event, its schedule and venue will appear here.</p>
                <button onClick={() => setActiveTab("All Events")} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700">Browse sports events</button>
              </div>
            ) : myMatches.filter(item => selectedSportFilter === "All" || item.sport === selectedSportFilter).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm">
                <Filter className="mx-auto h-7 w-7 text-slate-300" />
                <h4 className="mt-3 text-sm font-bold text-slate-900">No {selectedSportFilter} events</h4>
                <p className="mt-1 text-xs text-slate-500">Try another sport from the dropdown to see your matches.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myMatches
                  .filter(item => selectedSportFilter === "All" || item.sport === selectedSportFilter)
                  .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"))
                  .map(item => <MyMatchCard key={item.id} item={item} />)}
              </div>
            )}
          </section>
        </div>
      )}

      {/* All Events */}
      {activeTab === "All Events" && (
        <div className="space-y-3 sm:space-y-6 animate-fade-in-up text-left">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2.5">
            <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm active:scale-[0.98] transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Games</span>
                <div className="p-1 sm:p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{stats?.totalGames ?? fixturesList.length}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-bold uppercase tracking-wider">Scheduled</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm active:scale-[0.98] transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Live Now</span>
                <div className="p-1 sm:p-1.5 bg-red-50 text-red-600 rounded-lg">
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{stats?.liveNow ?? fixturesList.filter(f => f.status === "LIVE").length}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold uppercase tracking-wider animate-pulse">LIVE</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm active:scale-[0.98] transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Upcoming</span>
                <div className="p-1 sm:p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{stats?.upcoming ?? fixturesList.filter(f => f.status === "SCHEDULED").length}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-bold uppercase tracking-wider">Pending</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm active:scale-[0.98] transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
                <div className="p-1 sm:p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{stats?.completed ?? fixturesList.filter(f => f.status === "COMPLETED").length}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold uppercase tracking-wider">Done</span>
              </div>
            </div>
          </div>

          {/* Add / Edit Fixture Form (Inline Card) */}
          {isAdmin && showFixtureForm && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-md animate-fade-in-up space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 m-0 mb-0">{editingFixtureId !== null ? "Edit Fixture" : "Create New Fixture"}</h3>
                <button onClick={resetFixtureForm} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Match Name / Round</label>
                  <input
                    type="text"
                    placeholder="e.g. Semifinal 1 or Group Match"
                    value={fixtureName}
                    onChange={e => setFixtureName(e.target.value)}
                    className="w-full bg-[var(--mana-bg-input)] border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sport</label>
                  <select
                    value={fixtureSport}
                    onChange={e => setFixtureSport(e.target.value)}
                    className="w-full bg-[var(--mana-bg-input)] border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">Select Sport</option>
                    {sportsMeta.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Venue</label>
                  <select
                    value={fixtureVenue}
                    onChange={e => setFixtureVenue(e.target.value)}
                    className="w-full bg-[var(--mana-bg-input)] border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">Select Venue</option>
                    {venues.map(v => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
                  <DatePicker
                    value={fixtureDate}
                    onChange={(v) => setFixtureDate(v)}
                    placeholder="Pick fixture date"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Time</label>
                  <TimePicker
                    value={fixtureTime}
                    onChange={(v) => setFixtureTime(v)}
                    placeholder="Select time"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Team 1 (Home)</label>
                  <input
                    type="text"
                    placeholder="Home Team Name"
                    value={fixtureTeam1}
                    onChange={e => setFixtureTeam1(e.target.value)}
                    className="w-full bg-[var(--mana-bg-input)] border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Team 2 (Away)</label>
                  <input
                    type="text"
                    placeholder="Away Team Name"
                    value={fixtureTeam2}
                    onChange={e => setFixtureTeam2(e.target.value)}
                    className="w-full bg-[var(--mana-bg-input)] border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={fixtureStatus}
                    onChange={e => setFixtureStatus(e.target.value)}
                    className="w-full bg-[var(--mana-bg-input)] border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="LIVE">Live</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                {fixtureStatus === "COMPLETED" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Score 1</label>
                      <input
                        type="number"
                        min="0"
                        value={fixtureScore1}
                        onChange={e => setFixtureScore1(e.target.value)}
                        className="w-full bg-[var(--mana-bg-input)] border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Score 2</label>
                      <input
                        type="number"
                        min="0"
                        value={fixtureScore2}
                        onChange={e => setFixtureScore2(e.target.value)}
                        className="w-full bg-[var(--mana-bg-input)] border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={resetFixtureForm}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFixtureSave}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-100"
                >
                  {editingFixtureId !== null ? "Save Changes" : "Add Fixture"}
                </button>
              </div>
            </div>
          )}

          {/* Tournament & Sport Event Selectors */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tournament</label>
                <select
                  value={selectedTournamentId ?? ""}
                  onChange={e => setSelectedTournamentId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 focus:ring-2 focus:ring-indigo-300 outline-none text-slate-800"
                >
                  <option value="">All Tournaments</option>
                  {tournamentConfigs.map(c => (
                    <option key={c.id} value={c.id}>{c.tournamentName} — {c.eventName}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sport</label>
                <select
                  value={selectedSportFilter}
                  onChange={e => { setSelectedSportFilter(e.target.value); setFixtureSportFilter(e.target.value); }}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 focus:ring-2 focus:ring-indigo-300 outline-none text-slate-800"
                >
                  <option value="All">All Sports</option>
                  {sportsMeta.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {["All", "LIVE", "SCHEDULED", "COMPLETED"].map(status => {
              const isActive = fixtureStatusFilter === status;
              const count = status === "All" ? fixturesList.length : fixturesList.filter(f => f.status === status).length;
              const statusColors: Record<string, string> = {
                "All": isActive ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-100" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60",
                "LIVE": isActive ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md shadow-red-100" : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60",
                "SCHEDULED": isActive ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-100" : "bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200/60",
                "COMPLETED": isActive ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md shadow-emerald-100" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/60",
              };
              return (
                <button
                  key={status}
                  onClick={() => setFixtureStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${statusColors[status]}`}
                >
                  {status === "LIVE" && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                  {status === "All" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-white/20" : "bg-slate-200/60 text-slate-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Date Strip Navigation */}
          {fixtureDates.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
              <button
                onClick={() => setFixtureDateFilter(null)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  fixtureDateFilter === null
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                All Dates
              </button>
              {fixtureDates.map(d => {
                const dt = new Date(d + "T00:00:00");
                const isActive = fixtureDateFilter === d;
                return (
                  <button
                    key={d}
                    onClick={() => setFixtureDateFilter(isActive ? null : d)}
                    className={`flex flex-col items-center px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-w-[48px] ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                    }`}
                  >
                    <span className="text-[10px] uppercase opacity-70">{format(dt, "EEE")}</span>
                    <span className="font-bold">{format(dt, "d MMM")}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search and Actions Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/50">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search teams, venues, match names..."
                value={fixtureSearchQuery}
                onChange={e => setFixtureSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-sm w-full"
              />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {isAdmin && !showFixtureForm && (
                <button
                  onClick={() => setShowFixtureForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Match
                </button>
              )}
              {fixturesList.length > 0 && renderExportDropdown()}
            </div>
          </div>

          {/* Fixtures List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            {sortedFixtures.map((fixture) => {
              const IconComponent = getSportIcon(fixture.sport);
              const sportStyle = getSportColor(fixture.sport);
              const isLive = fixture.status === "LIVE";
              const isCompleted = fixture.status === "COMPLETED";

              return (
                <div
                  key={fixture.id}
                  className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-5 border shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-150 flex flex-col justify-between"
                  style={{
                    borderColor: isLive ? "rgba(239, 68, 68, 0.4)" : "rgba(226, 232, 240, 0.8)",
                    boxShadow: isLive ? "0 4px 18px rgba(239, 68, 68, 0.08)" : "none"
                  }}
                >
                  <div>
                    {/* Card Header: Sport badge, Venue and Status */}
                    <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <span
                        className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: sportStyle.bg, color: sportStyle.color }}
                      >
                        <IconComponent className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {fixture.sport}
                      </span>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {isLive && (
                          <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-bold animate-pulse border border-red-200">
                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-600 rounded-full"></span>
                            LIVE
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                            COMPLETED
                          </span>
                        )}
                        {!isLive && !isCompleted && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-slate-50 text-slate-500 text-[10px] font-semibold border border-slate-200">
                            SCHEDULED
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{fixture.name}</h4>

                    {/* Venue, Date & Time info */}
                    <div className="mt-1.5 sm:mt-3 space-y-1 sm:space-y-1.5 text-slate-500 text-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{fixture.venue}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                        <span>{fixture.date} at {fixture.time}</span>
                      </div>
                    </div>

                    {/* Teams and Scores Display */}
                    <div className="mt-2 sm:mt-4 bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-100 space-y-1.5 sm:space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-semibold ${isCompleted && Number(fixture.score1) > Number(fixture.score2) ? "text-slate-800 font-bold" : "text-slate-600"}`}>
                          {fixture.team1}
                        </span>
                        {(isLive || isCompleted) && (
                          <span className="text-[10px] font-bold font-mono bg-white px-1.5 sm:px-2 py-0.5 rounded border border-slate-200 shadow-sm text-slate-800">
                            {fixture.score1 || "0"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-semibold ${isCompleted && Number(fixture.score2) > Number(fixture.score1) ? "text-slate-800 font-bold" : "text-slate-600"}`}>
                          {fixture.team2}
                        </span>
                        {(isLive || isCompleted) && (
                          <span className="text-[10px] font-bold font-mono bg-white px-1.5 sm:px-2 py-0.5 rounded border border-slate-200 shadow-sm text-slate-800">
                            {fixture.score2 || "0"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live match view for spectators */}
                  {isLive && fixture.matchId && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100">
                      <button
                        onClick={() => openLiveView(fixture)}
                        className="w-full flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg sm:rounded-xl active:scale-[0.97] transition-all duration-150"
                      >
                        <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Watch Live
                      </button>
                    </div>
                  )}

                  {/* View Details for completed tournament matches */}
                  {isCompleted && fixture.matchId && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100">
                      <button
                        onClick={() => openMatchDetail(fixture)}
                        className="w-full flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg sm:rounded-xl active:scale-[0.97] transition-all duration-150"
                      >
                        <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        View Scorecard
                      </button>
                    </div>
                  )}

                  {/* Actions Row */}
                  {isAdmin && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {fixture.status === "SCHEDULED" && (
                          <button
                            onClick={() => setConfirmGoLiveFixture(fixture)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition"
                          >
                            <Play className="w-3 h-3 fill-red-600" />
                            Go Live
                          </button>
                        )}
                        {fixture.status === "LIVE" && (
                          <>
                            {fixture.matchId && (
                              <button
                                onClick={() => openLiveScoring(fixture)}
                                className="flex items-center gap-1 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition"
                              >
                                <Activity className="w-3 h-3" />
                                Live Score
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setScoringFixtureId(fixture.id);
                                setFixtureScore1(fixture.score1 || "");
                                setFixtureScore2(fixture.score2 || "");
                                setShowScoreModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition"
                            >
                              <Trophy className="w-3 h-3" />
                              End Match
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleFixtureEdit(fixture)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleFixtureDelete(fixture.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {sortedFixtures.length === 0 && (
              <div className="col-span-1 md:col-span-2 bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-xs font-bold text-slate-700">No matching fixtures found</h4>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
              </div>
            )}
          </div>

          {/* Inline Score Modal */}
          {showScoreModal && scoringFixtureId !== null && (() => {
            const scoringFixture = fixturesList.find(f => f.id === scoringFixtureId);
            return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
              <div className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-[95vw] sm:max-w-md shadow-2xl border border-slate-100 animate-scale-up text-left max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 mb-4">
                  <h3 className="text-xs font-bold text-slate-800 m-0 mb-0">Update Match Score</h3>
                  <button
                    onClick={() => { setShowScoreModal(false); setScoringFixtureId(null); }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-4 font-semibold uppercase tracking-wider">
                  {scoringFixture?.name}
                </p>

                {/* Result Type */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Result</label>
                  <select value={scoreResultType} onChange={e => setScoreResultType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-800 outline-none focus:border-indigo-500">
                    <option value="WIN">Win</option>
                    <option value="TIE">Tie</option>
                    <option value="DRAW">Draw</option>
                    <option value="NO_RESULT">No Result</option>
                    <option value="ABANDONED">Abandoned</option>
                  </select>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      {scoringFixture?.team1}
                    </label>
                    <input type="text" placeholder="0" value={fixtureScore1}
                      onChange={e => setFixtureScore1(e.target.value)}
                      className="w-full text-center bg-white border border-slate-200 rounded-xl py-2 text-lg font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      {scoringFixture?.team2}
                    </label>
                    <input type="text" placeholder="0" value={fixtureScore2}
                      onChange={e => setFixtureScore2(e.target.value)}
                      className="w-full text-center bg-white border border-slate-200 rounded-xl py-2 text-lg font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Winner Selection (only for WIN result) */}
                {scoreResultType === "WIN" && scoringFixture?.teamAId && scoringFixture?.teamBId && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Winner</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button"
                        onClick={() => setScoreWinnerId(scoringFixture.teamAId!)}
                        className={`px-3 py-2 text-sm font-semibold rounded-xl border transition ${scoreWinnerId === scoringFixture.teamAId ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        {scoringFixture.team1}
                      </button>
                      <button type="button"
                        onClick={() => setScoreWinnerId(scoringFixture.teamBId!)}
                        className={`px-3 py-2 text-sm font-semibold rounded-xl border transition ${scoreWinnerId === scoringFixture.teamBId ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        {scoringFixture.team2}
                      </button>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Notes (optional)</label>
                  <input type="text" placeholder="e.g. Won by 45 runs" value={scoreMatchNotes}
                    onChange={e => setScoreMatchNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => { setShowScoreModal(false); setScoringFixtureId(null); }}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScoreUpdateSubmit}
                    disabled={scoreSaving || (scoreResultType === "WIN" && !!scoringFixture?.matchId && !scoreWinnerId)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md shadow-emerald-100 disabled:opacity-50"
                  >
                    {scoreSaving ? "Saving..." : "Complete & Save"}
                  </button>
                </div>
              </div>
            </div>
            );
          })()}

          {/* Go Live Confirmation Modal with Date Validation */}
          {confirmGoLiveFixture && (() => {
            const fixture = confirmGoLiveFixture;
            const now = new Date();

            // Helper to parse dates safely
            const parseDateSafe = (dateStr?: string | null) => {
              if (!dateStr) return null;
              try {
                const d = new Date(dateStr);
                return isNaN(d.getTime()) ? null : d;
              } catch {
                return null;
              }
            };

            const startDate = parseDateSafe(fixture.rawStartDate) || (fixture.date ? parseDateSafe(fixture.date) : null);
            const endDate = parseDateSafe(fixture.rawEndDate);

            const isBeforeStart = startDate ? now.getTime() < startDate.getTime() : false;
            const isAfterEnd = endDate ? now.getTime() > endDate.getTime() : false;
            const isWithinSchedule = startDate ? (!isBeforeStart && (!endDate || !isAfterEnd)) : true;

            const formatDisplayDate = (d: Date | null, fallback?: string) => {
              if (!d) return fallback || "Not specified";
              try {
                return format(d, "dd MMM yyyy, hh:mm a");
              } catch {
                return fallback || "Not specified";
              }
            };

            const handleGoLive = () => {
              setFixturesList(prev => prev.map(f => f.id === fixture.id ? { ...f, status: "LIVE" } : f));
              toast.success(`Match "${fixture.name}" is now LIVE!`);
              fetchScheduleStats();
              setConfirmGoLiveFixture(null);
            };

            return (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-scale-up text-left">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
                        <Radio className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 leading-none m-0 mb-0">Confirm Go Live</h3>
                        <p className="text-xs text-slate-400 mt-1 m-0">Check schedule & broadcast live match</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmGoLiveFixture(null)}
                      className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Fixture Details Card */}
                  <div className="mt-4 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        {fixture.sport}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 truncate max-w-[60%] justify-end">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{fixture.venue}</span>
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 leading-snug">
                      {fixture.name}
                    </h4>

                    {(fixture.team1 || fixture.team2) && (
                      <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
                        <span className="truncate max-w-[42%] text-slate-800">{fixture.team1 || "TBD"}</span>
                        <span className="text-[10px] font-black uppercase text-indigo-500 px-1.5 py-0.5 rounded bg-indigo-50">VS</span>
                        <span className="truncate max-w-[42%] text-slate-800 text-right">{fixture.team2 || "TBD"}</span>
                      </div>
                    )}
                  </div>

                  {/* Scheduled Dates Section */}
                  <div className="mt-4 space-y-2.5">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Match Schedule
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase">
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          Start Date & Time
                        </div>
                        <div className="mt-1 font-semibold text-slate-800">
                          {formatDisplayDate(startDate, fixture.date ? `${fixture.date} ${fixture.time || ""}` : undefined)}
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase">
                          <Clock className="w-3 h-3 text-amber-500" />
                          End Date & Time
                        </div>
                        <div className="mt-1 font-semibold text-slate-800">
                          {formatDisplayDate(endDate, fixture.rawEndDate || "Same day / TBD")}
                        </div>
                      </div>
                    </div>

                    {/* Validation Alerts */}
                    {isBeforeStart && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-800">Early Start Notice</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            This match is scheduled to start later. Starting now will immediately notify community viewers that live scoring is underway.
                          </p>
                        </div>
                      </div>
                    )}

                    {isAfterEnd && (
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-rose-800">Schedule Expired Notice</p>
                          <p className="text-xs text-rose-700 mt-0.5">
                            The scheduled end date for this event has passed. Confirm if you still wish to broadcast live scoring.
                          </p>
                        </div>
                      </div>
                    )}

                    {isWithinSchedule && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-emerald-800">Ready to Go Live</p>
                          <p className="text-xs text-emerald-700 mt-0.5">
                            Current time is within the scheduled window. Ready to start live scoring.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setConfirmGoLiveFixture(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleGoLive}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/20 flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Confirm & Go Live
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Teams & Squads */}
      {activeTab === "Teams & Squads" && (
        <TeamsHubShowcase
          tournamentId={selectedTournamentId ?? undefined}
        />
      )}

      {/* Leaderboard */}
      {activeTab === "Leaderboard" && (() => {
        const activeTournament = tournamentConfigs.find(c => c.id === selectedTournamentId) || tournamentConfigs[0];
        const activeTournamentIsCricket = activeTournament ? isCricketSport(activeTournament.eventName || activeTournament.tournamentName || "") : false;
        const hasCricketConfig = tournamentConfigs.some(c => isCricketSport(c.eventName || c.tournamentName || ""));
        const hasGenericConfig = tournamentConfigs.some(c => !isCricketSport(c.eventName || c.tournamentName || ""));

        const showCricketLeaderboard = leaderboardViewType === "cricket"
          ? true
          : leaderboardViewType === "generic"
          ? false
          : (activeTournament ? activeTournamentIsCricket : (hasCricketConfig || activeIsCricket));

        return (
          <div className="space-y-4">
            {hasCricketConfig && hasGenericConfig && (
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setLeaderboardViewType("cricket")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    showCricketLeaderboard
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cricket Leaderboard (Caps & MVP)
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardViewType("generic")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    !showCricketLeaderboard
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Multi-Sport Leaderboard
                </button>
              </div>
            )}
            {showCricketLeaderboard ? <Leaderboard /> : <GenericLeaderboard />}
          </div>
        );
      })()}

      {/* Brackets */}
      {activeTab === "Brackets" && <BracketView eventId={eventId} tournamentConfigs={tournamentConfigs} initialConfigId={selectedTournamentId} />}

      {/* Config */}
      {activeTab === "Config" && (
        isAdmin ? <TournamentScheduler /> : (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
            <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <div className="font-bold text-slate-800">Access Restricted</div>
            <p className="text-xs text-slate-500 mt-1">Tournament Configuration is restricted to administrators.</p>
          </div>
        )
      )}

      {/* Setup Schedule */}
      {activeTab === "Setup Schedule" && (
        isAdmin ? <SetupSchedule initialEventId={eventId} /> : (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
            <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <div className="font-bold text-slate-800">Access Restricted</div>
            <p className="text-xs text-slate-500 mt-1">Schedule Setup is restricted to administrators.</p>
          </div>
        )
      )}

      {/* Manual Scheduler */}
      {activeTab === "Manual" && (
        isAdmin ? <ManualScheduler configId={selectedTournamentId ?? (tournamentConfigs[0]?.id)} /> : (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
            <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <div className="font-bold text-slate-800">Access Restricted</div>
            <p className="text-xs text-slate-500 mt-1">Manual Scheduler is restricted to administrators.</p>
          </div>
        )
      )}

      {/* Match Detail Modal */}
      {viewingMatchId !== null && (
        activeIsCricket ? (
          <MatchDetailView matchId={viewingMatchId} onClose={() => setViewingMatchId(null)} />
        ) : activeIsTimeSport ? (
          <RaceResultsView matchId={viewingMatchId} onClose={() => setViewingMatchId(null)} />
        ) : (
          <GenericMatchDetailView matchId={viewingMatchId} onClose={() => setViewingMatchId(null)} />
        )
      )}

      {/* Live Match View (Spectator) */}
      {liveViewMatchId !== null && (
        activeIsCricket ? (
          <LiveMatchView matchId={liveViewMatchId} onClose={() => setLiveViewMatchId(null)} />
        ) : activeIsTimeSport ? (
          <RaceResultsView matchId={liveViewMatchId} onClose={() => setLiveViewMatchId(null)} />
        ) : (
          <GenericLiveMatchView matchId={liveViewMatchId} onClose={() => setLiveViewMatchId(null)} />
        )
      )}

      {/* Live Scoring Panel (Admin) */}
      {liveScoringMatchId !== null && (
        activeIsCricket ? (
          <LiveScoringPanel matchId={liveScoringMatchId} onClose={() => setLiveScoringMatchId(null)} />
        ) : activeIsTimeSport ? (
          <RaceScoringPanel
            matchId={liveScoringMatchId}
            sportType={activeSportType}
            onClose={() => setLiveScoringMatchId(null)}
          />
        ) : (
          <GenericLiveScoringPanel
            matchId={liveScoringMatchId}
            sportType={activeSportType}
            onClose={() => setLiveScoringMatchId(null)}
            teamA={{ id: activeMatchFixture?.teamAId || 0, name: activeMatchFixture?.team1 || "Team A", color: "#6366f1" }}
            teamB={{ id: activeMatchFixture?.teamBId || 0, name: activeMatchFixture?.team2 || "Team B", color: "#f97316" }}
          />
        )
      )}
        </div>
      </main>
    </div>
  );
}
