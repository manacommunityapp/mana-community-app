import { useState, useMemo, useEffect } from "react";
import { SportsInsuranceBanner } from "./SportsInsuranceBanner";
import {
  Users,
  Zap,
  UserCheck,
  MapPin,
  Star,
  Clock,
  Calendar,
  ChevronRight,
  Search,
  SlidersHorizontal,
  MessageCircle,
  UserPlus,
  UserMinus,
  Trophy,
  Activity,
  Target,
  CheckCircle,
  X,
  Send,
  Sparkles,
  TrendingUp,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { sportsSocialService } from "../../../services/sports/sportsSocialService";
import type {
  MatchmakingProfile,
  MatchmakingResult,
  MatchmakingSkillLevel,
  SportsConversation,
  SportsMessage,
} from "../../../types/sportsSocial";

// ─── constants ────────────────────────────────────────────────────────────────

const SPORTS = ["CRICKET", "FOOTBALL", "BADMINTON", "TABLE_TENNIS", "VOLLEYBALL"];
const SKILL_LEVELS: MatchmakingSkillLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"];
const TIMES = ["MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PLAYPALS_KEY = "mana_sports_playpals_v1";
const MY_PROFILE_KEY = "mana_sports_my_profile_v1";

interface PlayPalEntry { playerId: string; playerName: string; status: "connected" | "pending_sent" | "pending_received"; connectedAt: string; }
interface MyProfile { sport: string; skillLevel: MatchmakingSkillLevel; preferredTime: string; availability: string[]; location: string; bio: string; }

const SKILL_COLOR: Record<MatchmakingSkillLevel, string> = {
  BEGINNER:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  INTERMEDIATE: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  ADVANCED:     "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  PRO:          "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function matchScoreColor(score: number) {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 55) return "text-amber-600 dark:text-amber-400";
  return "text-slate-500";
}

function matchScoreLabel(score: number) {
  if (score >= 80) return "Excellent match";
  if (score >= 65) return "Good match";
  if (score >= 50) return "Fair match";
  return "Possible match";
}

function loadPals(): PlayPalEntry[] {
  try { return JSON.parse(localStorage.getItem(PLAYPALS_KEY) || "[]"); } catch { return []; }
}
function savePals(p: PlayPalEntry[]) {
  localStorage.setItem(PLAYPALS_KEY, JSON.stringify(p));
}

// ─── player card ──────────────────────────────────────────────────────────────

function PlayerCard({
  profile,
  matchScore,
  matchReasons,
  distanceKm,
  palStatus,
  onConnect,
  onRemove,
  onMessage,
  compact,
}: {
  profile: MatchmakingProfile;
  matchScore?: number;
  matchReasons?: string[];
  distanceKm?: number;
  palStatus?: PlayPalEntry["status"] | null;
  onConnect: (p: MatchmakingProfile) => void;
  onRemove: (id: string) => void;
  onMessage: (p: MatchmakingProfile) => void;
  compact?: boolean;
}) {
  const initials = profile.playerName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 ${compact ? "" : "hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{profile.playerName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {profile.location}
                {distanceKm !== undefined && <span className="text-indigo-500 font-semibold ml-1">{distanceKm} km</span>}
              </p>
            </div>
            {matchScore !== undefined && (
              <div className="text-right flex-shrink-0">
                <p className={`text-base font-black tabular-nums ${matchScoreColor(matchScore)}`}>{matchScore}%</p>
                <p className="text-[9px] text-slate-400">{matchScoreLabel(matchScore)}</p>
              </div>
            )}
          </div>

          {/* Sports badges */}
          <div className="flex flex-wrap gap-1 mt-2">
            {profile.sports.map(s => (
              <span key={s.sport} className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${SKILL_COLOR[s.skillLevel]}`}>
                {s.sport.charAt(0) + s.sport.slice(1).toLowerCase().replace("_", " ")} · {s.skillLevel.charAt(0) + s.skillLevel.slice(1).toLowerCase()}
                {s.preferredPosition && <span className="font-normal opacity-70"> ({s.preferredPosition})</span>}
              </span>
            ))}
          </div>

          {/* Match reasons */}
          {matchReasons && matchReasons.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {matchReasons.map(r => (
                <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium">
                  ✓ {r}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-0.5"><Trophy className="w-2.5 h-2.5 text-amber-500" />{profile.matchesPlayed} matches</span>
            <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-amber-500" />{profile.rating.toFixed(1)}</span>
            <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />Active {timeAgo(profile.lastActive)}</span>
          </div>

          {/* Availability */}
          <div className="flex flex-wrap gap-1 mt-2">
            {profile.availability.map(d => (
              <span key={d} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{d.slice(0, 3)}</span>
            ))}
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{profile.preferredTime.charAt(0) + profile.preferredTime.slice(1).toLowerCase()}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {!palStatus && (
              <button
                type="button"
                onClick={() => onConnect(profile)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 transition cursor-pointer"
              >
                <UserPlus className="w-3 h-3" />
                Add PlayPal
              </button>
            )}
            {palStatus === "pending_sent" && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-bold">
                <Clock className="w-3 h-3" />
                Pending
              </span>
            )}
            {palStatus === "connected" && (
              <button
                type="button"
                onClick={() => onRemove(profile.playerId)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                <UserCheck className="w-3 h-3 text-emerald-500" />
                PlayPal
              </button>
            )}
            <button
              type="button"
              onClick={() => onMessage(profile)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <MessageCircle className="w-3 h-3" />
              Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

type MMTab = "discover" | "matches" | "playpals" | "messages";

export function SportsMatchmaking() {
  const [activeTab, setActiveTab] = useState<MMTab>("matches");
  const [pals, setPals] = useState<PlayPalEntry[]>(loadPals);
  const [convos, setConvos] = useState<SportsConversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<SportsMessage[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Discover filters
  const [searchQ, setSearchQ] = useState("");
  const [filterSport, setFilterSport] = useState("");
  const [filterSkill, setFilterSkill] = useState<MatchmakingSkillLevel | "">("");
  const [filterTime, setFilterTime] = useState("");

  // Smart match profile
  const [myProfile, setMyProfile] = useState<MyProfile>(() => {
    try { return JSON.parse(localStorage.getItem(MY_PROFILE_KEY) || "null") || { sport: "CRICKET", skillLevel: "INTERMEDIATE", preferredTime: "EVENING", availability: ["Saturday", "Sunday"], location: "Whitefield, Bangalore", bio: "" }; }
    catch { return { sport: "CRICKET", skillLevel: "INTERMEDIATE", preferredTime: "EVENING", availability: ["Saturday", "Sunday"], location: "Whitefield, Bangalore", bio: "" }; }
  });
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    setConvos(sportsSocialService.getConversations());
  }, []);

  function saveMyProfile(p: MyProfile) {
    setMyProfile(p);
    localStorage.setItem(MY_PROFILE_KEY, JSON.stringify(p));
  }

  // ── PlayPal helpers ───────────────────────────────────────────────────────
  function palStatus(playerId: string): PlayPalEntry["status"] | null {
    return pals.find(p => p.playerId === playerId)?.status ?? null;
  }

  function handleConnect(profile: MatchmakingProfile) {
    const updated = [...pals, { playerId: profile.playerId, playerName: profile.playerName, status: "pending_sent" as const, connectedAt: new Date().toISOString() }];
    setPals(updated); savePals(updated);
    toast.success(`PlayPal request sent to ${profile.playerName}`);
  }

  function handleAccept(playerId: string) {
    const updated = pals.map(p => p.playerId === playerId ? { ...p, status: "connected" as const } : p);
    setPals(updated); savePals(updated);
    toast.success("PlayPal connected!");
  }

  function handleRemove(playerId: string) {
    const updated = pals.filter(p => p.playerId !== playerId);
    setPals(updated); savePals(updated);
    toast.success("Removed from PlayPals");
  }

  // ── Messaging ─────────────────────────────────────────────────────────────
  function openConvoWith(profile: MatchmakingProfile) {
    const existing = convos.find(c => c.type === "DM" && c.participantIds.includes(profile.playerId));
    if (existing) {
      setActiveConvo(existing.id);
      setMessages(sportsSocialService.getMessages(existing.id));
      sportsSocialService.markRead(existing.id);
      setActiveTab("messages");
    } else {
      toast.info(`Messaging ${profile.playerName} — connect as PlayPal first to unlock DMs`);
    }
  }

  function handleSend() {
    if (!msgInput.trim() || !activeConvo) return;
    const msg = sportsSocialService.sendMessage(activeConvo, msgInput.trim());
    setMessages(prev => [...prev, msg]);
    setMsgInput("");
    setConvos(sportsSocialService.getConversations());
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const allProfiles = useMemo(() => sportsSocialService.getProfiles({
    sport: filterSport || undefined,
    skillLevel: filterSkill || undefined,
    preferredTime: filterTime || undefined,
  }), [filterSport, filterSkill, filterTime]);

  const filteredProfiles = useMemo(() => {
    if (!searchQ) return allProfiles;
    const q = searchQ.toLowerCase();
    return allProfiles.filter(p =>
      p.playerName.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.sports.some(s => s.sport.toLowerCase().includes(q) || (s.preferredPosition?.toLowerCase().includes(q) ?? false))
    );
  }, [allProfiles, searchQ]);

  const smartMatches: MatchmakingResult[] = useMemo(
    () => sportsSocialService.findMatches(myProfile.sport, myProfile.skillLevel),
    [myProfile.sport, myProfile.skillLevel],
  );

  const connectedPals = pals.filter(p => p.status === "connected");
  const pendingReceived = pals.filter(p => p.status === "pending_received");
  const pendingSent = pals.filter(p => p.status === "pending_sent");
  const totalUnread = convos.reduce((s, c) => s + c.unreadCount, 0);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-5 p-3 sm:p-5 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">PlayPals &amp; Matchmaking</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Smart skill-based player discovery</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5">
        {([
          { id: "matches"  as const, label: "Smart Matches", icon: Zap,         badge: 0            },
          { id: "discover" as const, label: "Discover",      icon: Search,       badge: 0            },
          { id: "playpals" as const, label: "PlayPals",      icon: UserCheck,    badge: pendingReceived.length },
          { id: "messages" as const, label: "Messages",      icon: MessageCircle,badge: totalUnread   },
        ] as const).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`relative flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              activeTab === t.id
                ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
            {t.badge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] text-white font-black flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════ SMART MATCHES ════ */}
      {activeTab === "matches" && (
        <div className="space-y-4">
          {/* My profile card */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border border-indigo-100 dark:border-indigo-900 rounded-2xl p-4">
            {editingProfile ? (
              <div className="space-y-3">
                <p className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Your Match Profile</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">My Sport</label>
                    <select value={myProfile.sport} onChange={e => setMyProfile(p => ({ ...p, sport: e.target.value }))}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none">
                      {SPORTS.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Skill Level</label>
                    <select value={myProfile.skillLevel} onChange={e => setMyProfile(p => ({ ...p, skillLevel: e.target.value as MatchmakingSkillLevel }))}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none">
                      {SKILL_LEVELS.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Preferred Time</label>
                    <select value={myProfile.preferredTime} onChange={e => setMyProfile(p => ({ ...p, preferredTime: e.target.value }))}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none">
                      {TIMES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Location</label>
                    <input value={myProfile.location} onChange={e => setMyProfile(p => ({ ...p, location: e.target.value }))}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Availability</label>
                  <div className="flex flex-wrap gap-1">
                    {DAYS.map(d => (
                      <button key={d} type="button" onClick={() => setMyProfile(p => ({ ...p, availability: p.availability.includes(d) ? p.availability.filter(x => x !== d) : [...p.availability, d] }))}
                        className={`text-[10px] px-2 py-1 rounded-lg font-bold cursor-pointer transition ${myProfile.availability.includes(d) ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"}`}>
                        {d.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { saveMyProfile(myProfile); setEditingProfile(false); toast.success("Profile updated"); }}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer">Save Profile</button>
                  <button type="button" onClick={() => setEditingProfile(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 cursor-pointer">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Matching you as</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${SKILL_COLOR[myProfile.skillLevel]}`}>
                      {myProfile.sport.charAt(0) + myProfile.sport.slice(1).toLowerCase().replace("_", " ")} · {myProfile.skillLevel.charAt(0) + myProfile.skillLevel.slice(1).toLowerCase()}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {myProfile.preferredTime.charAt(0) + myProfile.preferredTime.slice(1).toLowerCase()}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />{myProfile.location.split(",")[0]}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => setEditingProfile(true)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex-shrink-0">Edit</button>
              </div>
            )}
          </div>

          {/* Match results */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
              {smartMatches.length} players ranked by compatibility
            </p>
          </div>

          <div className="space-y-3">
            {smartMatches.map(result => (
              <PlayerCard
                key={result.player.playerId}
                profile={result.player}
                matchScore={result.matchScore}
                matchReasons={result.matchReasons}
                distanceKm={result.distanceKm}
                palStatus={palStatus(result.player.playerId)}
                onConnect={handleConnect}
                onRemove={handleRemove}
                onMessage={openConvoWith}
              />
            ))}
          </div>
        </div>
      )}

      {/* ════ DISCOVER ════ */}
      {activeTab === "discover" && (
        <div className="space-y-3">
          {/* Team cover nudge — shown at top of discover */}
          <SportsInsuranceBanner variant="team" compact />

          {/* Search + filter bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search players, locations, sports..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <button type="button" onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${showFilters ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Sport</label>
                  <select value={filterSport} onChange={e => setFilterSport(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none">
                    <option value="">All Sports</option>
                    {SPORTS.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Skill</label>
                  <select value={filterSkill} onChange={e => setFilterSkill(e.target.value as MatchmakingSkillLevel | "")}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none">
                    <option value="">Any Level</option>
                    {SKILL_LEVELS.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Time</label>
                  <select value={filterTime} onChange={e => setFilterTime(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none">
                    <option value="">Anytime</option>
                    {TIMES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
              </div>
              {(filterSport || filterSkill || filterTime) && (
                <button type="button" onClick={() => { setFilterSport(""); setFilterSkill(""); setFilterTime(""); }}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Results count */}
          <p className="text-[11px] text-slate-400">{filteredProfiles.length} players found</p>

          <div className="space-y-3">
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No players match your filters.</p>
              </div>
            ) : (
              filteredProfiles.map(profile => (
                <PlayerCard
                  key={profile.playerId}
                  profile={profile}
                  palStatus={palStatus(profile.playerId)}
                  onConnect={handleConnect}
                  onRemove={handleRemove}
                  onMessage={openConvoWith}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ════ PLAYPALS ════ */}
      {activeTab === "playpals" && (
        <div className="space-y-5">
          {/* Pending received */}
          {pendingReceived.length > 0 && (
            <div>
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-500" />
                Requests ({pendingReceived.length})
              </p>
              <div className="space-y-2">
                {pendingReceived.map(pal => (
                  <div key={pal.playerId} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {pal.playerName.charAt(0)}
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white flex-1">{pal.playerName}</p>
                    <button type="button" onClick={() => handleAccept(pal.playerId)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 cursor-pointer">
                      <CheckCircle className="w-3 h-3" />Accept
                    </button>
                    <button type="button" onClick={() => handleRemove(pal.playerId)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected pals */}
          <div>
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              My PlayPals ({connectedPals.length})
            </p>
            {connectedPals.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No PlayPals yet.</p>
                <p className="text-xs text-slate-400 mt-1">Go to Smart Matches or Discover to add players.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {connectedPals.map(pal => {
                  const profile = sportsSocialService.getProfiles().find(p => p.playerId === pal.playerId);
                  if (!profile) return null;
                  return (
                    <div key={pal.playerId} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {profile.playerName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{profile.playerName}</p>
                        <p className="text-[10px] text-slate-400">{profile.sports[0]?.sport.charAt(0) + profile.sports[0]?.sport.slice(1).toLowerCase()} · {profile.location.split(",")[0]}</p>
                      </div>
                      <button type="button" onClick={() => openConvoWith(profile)}
                        className="p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950 cursor-pointer text-indigo-500">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleRemove(pal.playerId)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400">
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending sent */}
          {pendingSent.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">Sent Requests ({pendingSent.length})</p>
              <div className="space-y-1.5">
                {pendingSent.map(pal => (
                  <div key={pal.playerId} className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                      {pal.playerName.charAt(0)}
                    </div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 flex-1">{pal.playerName}</p>
                    <span className="text-[10px] text-amber-500 font-bold">Pending</span>
                    <button type="button" onClick={() => handleRemove(pal.playerId)}
                      className="text-[10px] text-slate-400 hover:text-red-500 cursor-pointer">Cancel</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════ MESSAGES ════ */}
      {activeTab === "messages" && (
        <div className="space-y-3">
          {!activeConvo ? (
            <>
              <p className="text-[11px] text-slate-400">{convos.length} conversations</p>
              <div className="space-y-2">
                {convos.map(conv => {
                  const other = conv.participants.find(p => p.playerId !== "me");
                  const isOnline = conv.participants.some(p => p.playerId !== "me" && p.isOnline);
                  return (
                    <button key={conv.id} type="button"
                      onClick={() => { setActiveConvo(conv.id); setMessages(sportsSocialService.getMessages(conv.id)); sportsSocialService.markRead(conv.id); }}
                      className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-200 transition text-left cursor-pointer">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                          {conv.type === "GROUP" ? <Users className="w-4 h-4" /> : (other?.playerName.charAt(0) ?? "?")}
                        </div>
                        {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {conv.type === "GROUP" ? conv.groupName : other?.playerName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{conv.lastMessage}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-[9px] text-white font-black flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Message thread */
            <div className="flex flex-col h-[480px]">
              {/* Thread header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setActiveConvo(null)} className="text-indigo-500 hover:text-indigo-700 cursor-pointer">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                {(() => {
                  const conv = convos.find(c => c.id === activeConvo);
                  const other = conv?.participants.find(p => p.playerId !== "me");
                  return (
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{conv?.type === "GROUP" ? conv.groupName : other?.playerName}</p>
                      <p className="text-[10px] text-emerald-500">{other?.isOnline ? "Online" : "Offline"}</p>
                    </div>
                  );
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 py-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs ${
                      msg.senderId === "me"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-bl-sm"
                    }`}>
                      {msg.senderId !== "me" && (
                        <p className="text-[9px] font-bold opacity-60 mb-0.5">{msg.senderName}</p>
                      )}
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-300" />
                <button type="button" onClick={handleSend}
                  className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
