import { useState, useEffect, useMemo } from "react";
import { safeStorage } from "../../../utils/storage";
import { useParams, Link } from "react-router";
import { Loader2, MapPin, Clock, Filter, ChevronRight, ShieldAlert, Target, Activity, CalendarIcon, Plus, Edit2, Trash2, X, Search, Trophy, Play, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { sportsService } from "../../../services/sportsService";
import { sportsScheduleService, type EventListItem } from "../../../services/sportsScheduleService";
import { venueService } from "../../../services/venueService";
import { useAuth } from "../../../contexts/AuthContext";
import type { SportsEvent, Venue, SportMeta } from "../../../types/api";
import { CREATE_EDIT_SPORTS_MAIN } from "../../../constants/permissions";
import { showSuccess, showWarning, showError, showInfo } from "../../../utils/ToastUtils";
import { confirmAction } from "../../../utils/AlertUtils";
import { TIME_OPTIONS } from "../../../constants/timeOptions";
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
import { tournamentService } from "../../../services/tournamentService";
import { MatchDetailView } from "./MatchDetailView";
import { LiveMatchView } from "./LiveMatchView";
import { LiveScoringPanel } from "./LiveScoringPanel";
import { Leaderboard } from "./Leaderboard";

const TABS = ["Overview", "My Matches", "All Events", "Leaderboard", "Brackets", "Config", "Setup Schedule", "Manual"] as const;
type Tab = typeof TABS[number];


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
  Volleyball: Activity, volleyball: Activity,
  Cricket: Target, cricket: Target,
  Badminton: Activity, badminton: Activity
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
  Cricket: { color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
  cricket: { color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
  Badminton: { color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
  badminton: { color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
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
  const { user, hasPermission } = useAuth();
  const isAdmin = hasPermission ? hasPermission(CREATE_EDIT_SPORTS_MAIN) : false;

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (eventId) return "Setup Schedule";
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
  const [fixturesList, setFixturesList] = useState<{ id: number; matchId?: number; teamAId?: number; teamBId?: number; name: string; sport: string; venue: string; date: string; time: string; status: string; team1: string; team2: string; score1: string; score2: string }[]>([]);
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

  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoringFixtureId, setScoringFixtureId] = useState<number | null>(null);
  const [viewingMatchId, setViewingMatchId] = useState<number | null>(null);
  const [liveViewMatchId, setLiveViewMatchId] = useState<number | null>(null);
  const [liveScoringMatchId, setLiveScoringMatchId] = useState<number | null>(null);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [sportsMeta, setSportsMeta] = useState<SportMeta[]>([]);

  useEffect(() => {
    if (user?.communityId) {
      venueService.getVenues(user.communityId).then(setVenues).catch(() => {});
      sportsService.getSportsMeta().then(setSportsMeta).catch(() => {});
    }
  }, [user?.communityId]);

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

  const filteredFixtures = useMemo(() => {
    return fixturesList.filter(f => {
      const searchStr = `${f.name} ${f.team1} ${f.team2} ${f.venue}`.toLowerCase();
      const matchesSearch = searchStr.includes(fixtureSearchQuery.toLowerCase());
      const matchesSport = fixtureSportFilter === "All" || f.sport.toLowerCase().includes(fixtureSportFilter.toLowerCase());
      return matchesSearch && matchesSport;
    });
  }, [fixturesList, fixtureSearchQuery, fixtureSportFilter]);

  const sortedFixtures = useMemo(() => {
    const statusWeight = { LIVE: 0, SCHEDULED: 1, COMPLETED: 2 };
    return [...filteredFixtures].sort((a, b) => {
      const weightA = statusWeight[a.status as keyof typeof statusWeight] ?? 99;
      const weightB = statusWeight[b.status as keyof typeof statusWeight] ?? 99;
      if (weightA !== weightB) return weightA - weightB;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [filteredFixtures]);

  useEffect(() => {
    if (!user?.userId) return;
    setLoading(true);

    if (activeTab === "My Matches") {
      sportsScheduleService.getMyEvents()
        .then(events => {
          setMyMatches(events.map(e => ({
            date: e.eventDateStart ?? "",
            name: `${e.sportName ?? "Event"} — ${e.name}`,
            venue: e.venueName ?? "TBD",
            status: e.registrationStatus ?? "",
            statusColor: e.registrationStatus === "LIVE" ? "#10b981" : "#f97316",
            badges: [
              { label: e.registrationStatus ?? "", color: e.registrationStatus === "LIVE" ? "#10b981" : "#f97316" },
              { label: e.categoryName ?? "General", color: "#3b82f6" }
            ]
          })));
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    } else if ((activeTab === "All Events" || activeTab === "Overview") && user?.communityId) {
      fetchScheduleStats();
      const eventsPromise = sportsScheduleService.getOpenEvents(user.communityId);
      const configsPromise = tournamentService.getConfigs();

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
              score2: ""
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

      {/* Overview */}
      {activeTab === "Overview" && (
        <div className="space-y-3 sm:space-y-6 animate-fade-in-up text-left">
          {/* Welcome/Hero Banner */}
          <div
            className="rounded-2xl sm:rounded-3xl py-2 px-3 sm:py-3 sm:px-5 text-white relative overflow-hidden shadow-lg border border-indigo-500/10"
            style={{
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
            }}
          >
            <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
              <Trophy className="w-12 h-12 sm:w-28 sm:h-28 rotate-12" />
            </div>
            <div className="max-w-xl relative z-10 space-y-0.5 sm:space-y-1">
              <span className="px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-bold tracking-widest uppercase bg-indigo-500/30 border border-indigo-400/20 text-indigo-200 inline-block mb-0.5">
                Tournament Hub
              </span>
              <h2 className="text-[13px] sm:text-lg md:text-xl font-extrabold tracking-tight">Schedule & Live Center</h2>
              <p className="text-[9px] sm:text-[11px] text-indigo-200 leading-relaxed max-w-lg">
                Track tournament match scheduling, ongoing live scores, team brackets, and complete event results all in one place.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-4">
            <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md active:scale-[0.97] transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled</span>
                <div className="p-1 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl">
                  <CalendarIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-1 sm:mt-4 flex items-baseline gap-1.5">
                <span className="text-lg sm:text-3xl font-extrabold text-slate-800 tracking-tight">{stats?.totalGames ?? fixturesList.length}</span>
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">Total</span>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md active:scale-[0.97] transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Now</span>
                <div className="p-1 sm:p-2 bg-red-50 text-red-600 rounded-lg sm:rounded-xl">
                  <Activity className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-1 sm:mt-4 flex items-baseline gap-1.5">
                <span className="text-lg sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                  {stats?.liveNow ?? fixturesList.filter(f => f.status === "LIVE").length}
                </span>
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold animate-pulse">LIVE</span>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md active:scale-[0.97] transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
                <div className="p-1 sm:p-2 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl">
                  <Trophy className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-1 sm:mt-4 flex items-baseline gap-1.5">
                <span className="text-lg sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                  {stats?.completed ?? fixturesList.filter(f => f.status === "COMPLETED").length}
                </span>
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">Done</span>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md active:scale-[0.97] transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Venues</span>
                <div className="p-1 sm:p-2 bg-amber-50 text-amber-600 rounded-lg sm:rounded-xl">
                  <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-1 sm:mt-4 flex items-baseline gap-1.5">
                <span className="text-lg sm:text-3xl font-extrabold text-slate-800 tracking-tight">{venues.length || 4}</span>
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
            {/* Left Column: Live Matches & Navigation */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-6">
              {/* Ongoing Matches Section */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-sm space-y-2.5 sm:space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-3">
                  <h3 className="text-[11px] sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500 animate-pulse"></span>
                    Live Matches
                  </h3>
                  <button onClick={() => setActiveTab("All Events")} className="text-[10px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-800 active:scale-[0.95] transition">
                    View All →
                  </button>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {fixturesList.filter(f => f.status === "LIVE").length === 0 ? (
                    <div className="text-center py-5 sm:py-8 text-slate-400 text-[10px] sm:text-xs">
                      No live matches running at the moment.
                    </div>
                  ) : (
                    fixturesList.filter(f => f.status === "LIVE").map((fixture) => {
                      const IconComponent = getSportIcon(fixture.sport);
                      const colors = getSportColors(fixture.sport);
                      return (
                        <div key={fixture.id} className="p-2 sm:p-4 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl flex items-center justify-between active:scale-[0.98] transition-all duration-150">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2.5 rounded-lg" style={{ backgroundColor: colors.bg, color: colors.color }}>
                              <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="text-left">
                              <p className="text-[9px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">{fixture.sport}</p>
                              <h4 className="text-[11px] sm:text-sm font-bold text-slate-800 leading-snug">{fixture.team1} vs {fixture.team2}</h4>
                              <p className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px] sm:max-w-[220px]">{fixture.venue}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200/60 shadow-sm font-mono text-[11px] sm:text-sm font-bold text-slate-800">
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
              <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-sm space-y-2.5 sm:space-y-4">
                <h3 className="text-[11px] sm:text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 sm:pb-3">
                  Quick Navigation
                </h3>
                <div className="flex overflow-x-auto gap-2 sm:grid sm:grid-cols-3 sm:gap-4 pb-1 sm:pb-0 -mx-0.5 px-0.5 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-hide">
                  <div
                    onClick={() => setActiveTab("My Matches")}
                    className="min-w-[120px] sm:min-w-0 snap-start shrink-0 sm:shrink p-2.5 sm:p-4 bg-slate-50 hover:bg-indigo-50/30 rounded-lg sm:rounded-xl border border-slate-100 hover:border-indigo-100 active:scale-[0.96] transition-all duration-150 cursor-pointer text-left space-y-1.5 sm:space-y-2 group"
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <h4 className="text-[10px] sm:text-xs font-bold text-slate-800">My Timeline</h4>
                    <p className="text-[9px] sm:text-[11px] text-slate-500 leading-relaxed hidden sm:block">Check matches registered for your personal schedule.</p>
                  </div>

                  <div
                    onClick={() => setActiveTab("All Events")}
                    className="min-w-[120px] sm:min-w-0 snap-start shrink-0 sm:shrink p-2.5 sm:p-4 bg-slate-50 hover:bg-indigo-50/30 rounded-lg sm:rounded-xl border border-slate-100 hover:border-indigo-100 active:scale-[0.96] transition-all duration-150 cursor-pointer text-left space-y-1.5 sm:space-y-2 group"
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                      <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <h4 className="text-[10px] sm:text-xs font-bold text-slate-800">All Fixtures</h4>
                    <p className="text-[9px] sm:text-[11px] text-slate-500 leading-relaxed hidden sm:block">Browse, search and configure overall match listings.</p>
                  </div>

                  <div
                    onClick={() => setActiveTab("Brackets")}
                    className="min-w-[120px] sm:min-w-0 snap-start shrink-0 sm:shrink p-2.5 sm:p-4 bg-slate-50 hover:bg-indigo-50/30 rounded-lg sm:rounded-xl border border-slate-100 hover:border-indigo-100 active:scale-[0.96] transition-all duration-150 cursor-pointer text-left space-y-1.5 sm:space-y-2 group"
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-200">
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <h4 className="text-[10px] sm:text-xs font-bold text-slate-800">Brackets</h4>
                    <p className="text-[9px] sm:text-[11px] text-slate-500 leading-relaxed hidden sm:block">View elimination rounds, quarter, and semifinals.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Recent Results & Timeline */}
            <div className="space-y-3 sm:space-y-6">
              <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-sm space-y-2.5 sm:space-y-4">
                <h3 className="text-[11px] sm:text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 sm:pb-3">
                  Recent Results
                </h3>
                <div className="space-y-2.5 sm:space-y-3.5">
                  {fixturesList.filter(f => f.status === "COMPLETED").length === 0 ? (
                    <div className="text-center py-5 sm:py-8 text-slate-400 text-[10px] sm:text-xs">
                      No completed matches found.
                    </div>
                  ) : (
                    fixturesList.filter(f => f.status === "COMPLETED").slice(0, 4).map((fixture) => {
                      const IconComponent = getSportIcon(fixture.sport);
                      const colors = getSportColors(fixture.sport);
                      const score1 = Number(fixture.score1 || 0);
                      const score2 = Number(fixture.score2 || 0);
                      return (
                        <div key={fixture.id} className="text-left space-y-1.5 sm:space-y-2 pb-2.5 sm:pb-3.5 border-b border-slate-100 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <IconComponent className="w-2.5 h-2.5 sm:w-3 sm:h-3" style={{ color: colors.color }} />
                              {fixture.sport}
                            </span>
                            <span>{fixture.date}</span>
                          </div>
                          <div className="space-y-0.5 sm:space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] sm:text-xs ${score1 > score2 ? "font-bold text-slate-800" : "text-slate-600"}`}>{fixture.team1}</span>
                              <span className={`text-[10px] sm:text-xs font-mono font-bold ${score1 > score2 ? "text-slate-800" : "text-slate-500"}`}>{score1}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] sm:text-xs ${score2 > score1 ? "font-bold text-slate-800" : "text-slate-600"}`}>{fixture.team2}</span>
                              <span className={`text-[10px] sm:text-xs font-mono font-bold ${score2 > score1 ? "text-slate-800" : "text-slate-500"}`}>{score2}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick Info Box */}
              <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 border border-slate-100 text-left space-y-1.5 sm:space-y-2">
                <h4 className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">Administrative Note</h4>
                <p className="text-[9px] sm:text-[11px] text-slate-500 leading-relaxed">
                  If you are an organizer, use the operations panel (Config, Setup Schedule, Manual) to run automated round robin schedulers or create custom matches. Match results are synchronized live.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="space-y-3 sm:space-y-6 animate-fade-in-up text-left">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-4">
            <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md active:scale-[0.97] transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Games</span>
                <div className="p-1 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl">
                  <CalendarIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-1 sm:mt-4 flex items-baseline gap-1.5">
                <span className="text-lg sm:text-3xl font-extrabold text-slate-800 tracking-tight">{stats?.totalGames ?? fixturesList.length}</span>
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">Scheduled</span>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md active:scale-[0.97] transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Now</span>
                <div className="p-1 sm:p-2 bg-red-50 text-red-600 rounded-lg sm:rounded-xl">
                  <Activity className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-1 sm:mt-4 flex items-baseline gap-1.5">
                <span className="text-lg sm:text-3xl font-extrabold text-slate-800 tracking-tight">{stats?.liveNow ?? fixturesList.filter(f => f.status === "LIVE").length}</span>
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold animate-pulse">LIVE</span>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md active:scale-[0.97] transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming</span>
                <div className="p-1 sm:p-2 bg-amber-50 text-amber-600 rounded-lg sm:rounded-xl">
                  <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-1 sm:mt-4 flex items-baseline gap-1.5">
                <span className="text-lg sm:text-3xl font-extrabold text-slate-800 tracking-tight">{stats?.upcoming ?? fixturesList.filter(f => f.status === "SCHEDULED").length}</span>
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">Pending</span>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md active:scale-[0.97] transition-all duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
                <div className="p-1 sm:p-2 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl">
                  <Trophy className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-1 sm:mt-4 flex items-baseline gap-1.5">
                <span className="text-lg sm:text-3xl font-extrabold text-slate-800 tracking-tight">{stats?.completed ?? fixturesList.filter(f => f.status === "COMPLETED").length}</span>
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">Done</span>
              </div>
            </div>
          </div>

          {/* Add / Edit Fixture Form (Inline Card) */}
          {isAdmin && showFixtureForm && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-md animate-fade-in-up space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">{editingFixtureId !== null ? "Edit Fixture" : "Create New Fixture"}</h3>
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
                  <input
                    type="date"
                    value={fixtureDate}
                    onChange={e => setFixtureDate(e.target.value)}
                    className="w-full bg-[var(--mana-bg-input)] border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Time</label>
                  <select
                    value={fixtureTime}
                    onChange={e => setFixtureTime(e.target.value)}
                    className="w-full bg-[var(--mana-bg-input)] border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">Select Time</option>
                    {TIME_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
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

          {/* Search, Filter and Actions Bar */}
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
              <div className="flex items-center gap-1.5">
                {["All", ...sportsMeta.map(s => s.name)].map((f) => {
                  const isActive = fixtureSportFilter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFixtureSportFilter(f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-100"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
              {isAdmin && !showFixtureForm && (
                <button
                  onClick={() => setShowFixtureForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Match
                </button>
              )}
            </div>
          </div>

          {/* Fixtures List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            {sortedFixtures.map((fixture) => {
              const IconComponent = getSportIcon(fixture.sport);
              const sportStyle = getSportColors(fixture.sport);
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
                        className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold"
                        style={{ backgroundColor: sportStyle.bg, color: sportStyle.color }}
                      >
                        <IconComponent className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {fixture.sport}
                      </span>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {isLive && (
                          <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-red-50 text-red-600 text-[8px] sm:text-[10px] font-bold animate-pulse border border-red-200">
                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-600 rounded-full"></span>
                            LIVE
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[8px] sm:text-[10px] font-semibold border border-emerald-100">
                            COMPLETED
                          </span>
                        )}
                        {!isLive && !isCompleted && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-slate-50 text-slate-500 text-[8px] sm:text-[10px] font-semibold border border-slate-200">
                            SCHEDULED
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-[11px] sm:text-sm font-bold text-slate-800 line-clamp-1">{fixture.name}</h4>

                    {/* Venue, Date & Time info */}
                    <div className="mt-1.5 sm:mt-3 space-y-1 sm:space-y-1.5 text-slate-500 text-[10px] sm:text-xs">
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
                        <span className={`text-[10px] sm:text-xs font-semibold ${isCompleted && Number(fixture.score1) > Number(fixture.score2) ? "text-slate-800 font-bold" : "text-slate-600"}`}>
                          {fixture.team1}
                        </span>
                        {(isLive || isCompleted) && (
                          <span className="text-[10px] sm:text-xs font-bold font-mono bg-white px-1.5 sm:px-2 py-0.5 rounded border border-slate-200 shadow-sm text-slate-800">
                            {fixture.score1 || "0"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] sm:text-xs font-semibold ${isCompleted && Number(fixture.score2) > Number(fixture.score1) ? "text-slate-800 font-bold" : "text-slate-600"}`}>
                          {fixture.team2}
                        </span>
                        {(isLive || isCompleted) && (
                          <span className="text-[10px] sm:text-xs font-bold font-mono bg-white px-1.5 sm:px-2 py-0.5 rounded border border-slate-200 shadow-sm text-slate-800">
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
                        onClick={() => setLiveViewMatchId(fixture.matchId!)}
                        className="w-full flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl active:scale-[0.97] transition-all duration-150"
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
                        onClick={() => setViewingMatchId(fixture.matchId!)}
                        className="w-full flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl active:scale-[0.97] transition-all duration-150"
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
                            onClick={() => {
                              setFixturesList(prev => prev.map(f => f.id === fixture.id ? { ...f, status: "LIVE" } : f));
                              toast.success("Match is now LIVE!");
                              fetchScheduleStats();
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded-lg transition"
                          >
                            <Play className="w-3 h-3 fill-red-600" />
                            Go Live
                          </button>
                        )}
                        {fixture.status === "LIVE" && (
                          <>
                            {fixture.matchId && (
                              <button
                                onClick={() => setLiveScoringMatchId(fixture.matchId!)}
                                className="flex items-center gap-1 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded-lg transition"
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
                              className="flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-lg transition"
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
                <h4 className="text-sm font-bold text-slate-700">No matching fixtures found</h4>
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
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">Update Match Score</h3>
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
                    disabled={scoreSaving || (scoreResultType === "WIN" && scoringFixture?.matchId && !scoreWinnerId)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md shadow-emerald-100 disabled:opacity-50"
                  >
                    {scoreSaving ? "Saving..." : "Complete & Save"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === "Leaderboard" && <Leaderboard />}

      {/* Brackets */}
      {activeTab === "Brackets" && <BracketView eventId={eventId} />}

      {/* Config */}
      {activeTab === "Config" && <TournamentScheduler />}

      {/* Setup Schedule */}
      {activeTab === "Setup Schedule" && <SetupSchedule initialEventId={eventId} />}

      {/* Manual Scheduler */}
      {activeTab === "Manual" && <ManualScheduler />}

      {/* Match Detail Modal */}
      {viewingMatchId !== null && (
        <MatchDetailView matchId={viewingMatchId} onClose={() => setViewingMatchId(null)} />
      )}

      {/* Live Match View (Spectator) */}
      {liveViewMatchId !== null && (
        <LiveMatchView matchId={liveViewMatchId} onClose={() => setLiveViewMatchId(null)} />
      )}

      {/* Live Scoring Panel (Admin) */}
      {liveScoringMatchId !== null && (
        <LiveScoringPanel matchId={liveScoringMatchId} onClose={() => setLiveScoringMatchId(null)} />
      )}
        </div>
      </main>
    </div>
  );
}
