import { useState, useEffect, useRef, useMemo } from "react";
import {
  Trophy,
  Users,
  Calendar,
  Star,
  Target,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  Plus,
  Activity,
  Award,
  Zap,
  Loader2,
  Settings,
  ShieldCheck,
  Trash2,
  Building2,
  Search,
  Filter,
  Share2,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Sparkles,
  AlertCircle,
  ArrowUpRight,
  Flame,
  Shield,
  Compass,
  HeartHandshake,
  Crown,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { safeStorage } from "../../../utils/storage";
import "./SportsAuction.css";
import { sportsService } from "../../../services/sports/sportsService";
import { sportsScheduleService, type EventListItem, type RegistrationListItem } from "../../../services/sports/sportsScheduleService";
import { auctionService } from "../../../services/sports/auctionService";
import { isTeamSport } from "./utils/sportsConstants";
import { communityService } from "../../../services/community/communityService";
import { venueService } from "../../../services/bookings/venueService";
import { familyService, type FamilyMember } from "../../../services/common/familyService";
import { SportsPartnerSelector, type SelectedPartnerInfo } from "./SportsPartnerSelector";
import type { SportMeta, AuctionTeam, CommunityResponse, Venue } from "../../../types/api";

const ALL_SPORTS = [
  { id: "cricket",     icon: "🏏", name: "Cricket",     roles: ["Top-order Batsman", "Middle-order Batsman", "All-Rounder", "Fast Bowler", "Spin Bowler", "Wicket-keeper"] },
  { id: "badminton",   icon: "🏸", name: "Badminton",   roles: ["Singles Specialist", "Doubles Front/Net", "Doubles Back/Smash", "Mixed Doubles Specialist"] },
  { id: "football",    icon: "⚽", name: "Football",    roles: ["Striker / Forward", "Winger", "Midfielder / Playmaker", "Center Back / Defender", "Goalkeeper"] },
  { id: "tennis",      icon: "🎾", name: "Tennis",      roles: ["Baseline Aggressive", "Serve & Volleyer", "All-Court Player", "Doubles Specialist"] },
  { id: "volleyball",  icon: "🏐", name: "Volleyball",  roles: ["Outside Hitter / Spiker", "Middle Blocker", "Setter", "Libero / Defensive"] },
  { id: "tabletennis", icon: "🏓", name: "Table Tennis", roles: ["Offensive Looper", "Pips Attacker", "Defensive Chopper", "All-Round"] },
  { id: "basketball",  icon: "🏀", name: "Basketball",  roles: ["Point Guard (PG)", "Shooting Guard (SG)", "Small Forward (SF)", "Power Forward (PF)", "Center (C)"] },
  { id: "chess",       icon: "♟️", name: "Chess",       roles: ["Positional Player", "Tactical Attacker", "Endgame Specialist", "Rapid / Blitz Player"] },
];

const SKILL_LEVELS = [
  { id: "Beginner",     label: "Beginner",     desc: "Casual & recreational player",   color: "#10b981", badge: "🌱 Level 1" },
  { id: "Intermediate", label: "Intermediate", desc: "Regular player with good skills",color: "#3b82f6", badge: "⚡ Level 2" },
  { id: "Advanced",     label: "Advanced",     desc: "Competitive tournament player",  color: "#8b5cf6", badge: "🔥 Level 3" },
  { id: "Club Pro",     label: "Club Pro",     desc: "Ranked & semi-professional",     color: "#f59e0b", badge: "👑 Level 4" },
];

const TABS = [
  { id: "overview",    label: "Overview",        icon: Trophy },
  { id: "tournaments", label: "My Tournaments",  icon: Trophy },
  { id: "community",   label: "My Community",    icon: Building2 },
  { id: "teams",       label: "My Teams",        icon: Users },
  { id: "matches",     label: "My Matches",      icon: Calendar },
  { id: "settings",    label: "Settings",        icon: Settings },
] as const;

type TabId = typeof TABS[number]["id"];
type StatsTab = string;

function getCategory(age: number, gender: string): string {
  if (age < 12) return "Kids (Under 12)";
  if (age < 18) return gender === "Female" ? "Girls (12-18)" : "Boys (12-18)";
  if (age > 55) return "Senior Citizens (55+)";
  return gender === "Female" ? "Womens (18-55)" : "Mens (18-55)";
}

const ACHIEVEMENT_DEFS = [
  { id: 1, title: "First Registration", desc: "Register for an event", icon: Star, color: "#f59e0b", check: (r: number) => r >= 1 },
  { id: 2, title: "Team Player", desc: "Join an auction squad", icon: Users, color: "#10b981", check: (_r: number, t: number) => t >= 1 },
  { id: 3, title: "Active Competitor", desc: "Participate in 3+ matches", icon: Zap, color: "#6366f1", check: (_r: number, _t: number, m: number) => m >= 3 },
  { id: 4, title: "Player Settings", desc: "Complete your player settings", icon: Settings, color: "#ec4899", check: (_r: number, _t: number, _m: number, p: boolean) => p },
  { id: 5, title: "Versatile Athlete", desc: "Play across multiple sports", icon: Activity, color: "#8b5cf6", check: (r: number) => r >= 2 },
  { id: 6, title: "Champion Material", desc: "Active in community league", icon: Award, color: "#ef4444", check: (_r: number, t: number, m: number) => t >= 1 || m >= 1 },
];

interface PlayerPassport {
  skillLevel: string;
  primarySport: string;
  dominantHand: string;
  jerseyNumber: string;
  jerseyName: string;
  sportRoles: Record<string, string>;
  preferredSlots: string[];
  bio: string;
}

const DEFAULT_PASSPORT: PlayerPassport = {
  skillLevel: "Intermediate",
  primarySport: "badminton",
  dominantHand: "Right",
  jerseyNumber: "7",
  jerseyName: "",
  sportRoles: {
    badminton: "Doubles Specialist",
    cricket: "All-Rounder",
    football: "Midfielder / Playmaker",
    tennis: "All-Court Player",
    tabletennis: "Offensive Looper",
  },
  preferredSlots: ["Weekends", "Weekday Evenings"],
  bio: "Passionate community athlete looking for competitive and fun games.",
};

export function MySports() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (location.pathname.endsWith("/register") || location.pathname.endsWith("/settings") || location.pathname.endsWith("/passport")) {
      return "settings";
    }
    return "overview";
  });
  const [activeStatsTab, setActiveStatsTab] = useState<StatsTab>("");

  useEffect(() => {
    if (location.pathname.endsWith("/register") || location.pathname.endsWith("/settings") || location.pathname.endsWith("/passport")) {
      setActiveTab("settings");
    } else if (location.pathname.endsWith("/my-sports")) {
      setActiveTab("overview");
    }
  }, [location.pathname]);

  // Dashboard states
  const [registrations, setRegistrations] = useState<RegistrationListItem[]>([]);
  const [teams, setTeams] = useState<AuctionTeam[]>([]);
  const [myMatches, setMyMatches] = useState<EventListItem[]>([]);
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [partnerInvitations, setPartnerInvitations] = useState<any[]>([]);
  const [respondingInviteId, setRespondingInviteId] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Partner Nomination Modal state
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [partnerModalState, setPartnerModalState] = useState<{
    open: boolean;
    registration: RegistrationListItem | null;
    selectedPartner: SelectedPartnerInfo | null;
    saving: boolean;
  }>({
    open: false,
    registration: null,
    selectedPartner: null,
    saving: false,
  });

  // Captain Nomination Modal state
  const [captainModalState, setCaptainModalState] = useState<{
    open: boolean;
    registration: RegistrationListItem | null;
    nominated: boolean;
    teamName: string;
    saving: boolean;
  }>({
    open: false,
    registration: null,
    nominated: false,
    teamName: "",
    saving: false,
  });

  // Tournament tab filters
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [tournamentSportFilter, setTournamentSportFilter] = useState("All");
  const [tournamentStatusFilter, setTournamentStatusFilter] = useState("All");

  // Player Passport state
  const [passport, setPassport] = useState<PlayerPassport>(() => {
    const saved = safeStorage.getItem("mana_player_sports_passport");
    if (saved) {
      try {
        return { ...DEFAULT_PASSPORT, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_PASSPORT;
      }
    }
    return {
      ...DEFAULT_PASSPORT,
      jerseyName: user?.fullName ? user.fullName.split(" ")[0].toUpperCase() : "PLAYER",
    };
  });
  const [passportSaved, setPassportSaved] = useState(false);

  const displayName = user?.fullName ?? "Player";
  const userInitials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "P";

  const hydratedRef = useRef<Set<string>>(new Set());

  const fetchCoreData = async () => {
    if (!user?.userId) return;
    setLoadingData(true);
    try {
      const [regs, myTeams, events, partnerInvites, famMembers] = await Promise.all([
        sportsScheduleService.getMyRegistrations().catch(() => []),
        auctionService.getCaptainRegistration().catch(() => []),
        sportsScheduleService.getMyEvents().catch(() => []),
        sportsService.getPartnerInvitations("PENDING").catch(() => []),
        familyService.getFamilyMembers().catch(() => []),
      ]);
      setRegistrations(regs || []);
      setTeams(myTeams || []);
      setMyMatches(events || []);
      setPartnerInvitations(partnerInvites || []);
      setFamilyMembers(famMembers || []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchCoreData();
  }, [user?.userId]);

  useEffect(() => {
    if (!user?.userId) return;
    if (activeTab === "community" && !hydratedRef.current.has("community")) {
      hydratedRef.current.add("community");
      communityService.getCommunities().then(c => setCommunities(c || [])).catch(() => {});
      if (user?.communityId) {
        venueService.getVenues(user.communityId).then(v => setVenues(v || [])).catch(() => {});
      }
    }
  }, [activeTab, user?.userId, user?.communityId]);

  const handleWithdraw = async (regId: number) => {
    if (!confirm("Are you sure you want to withdraw from this tournament event?")) return;
    try {
      await sportsService.withdraw(regId);
      toast.success("Withdrawn from tournament successfully");
      fetchCoreData();
    } catch (err) {
      toast.error("Failed to withdraw from tournament");
    }
  };

  const handleRespondInvitation = async (invitationId: number, accept: boolean) => {
    let reason: string | undefined = undefined;
    if (!accept) {
      const entered = window.prompt("Optional reason for declining partner invitation:");
      if (entered === null) return;
      reason = entered || undefined;
    }
    setRespondingInviteId(invitationId);
    try {
      await sportsService.respondToPartnerInvitation(invitationId, accept, reason);
      toast.success(accept ? "Partner invitation accepted!" : "Partner invitation declined");
      fetchCoreData();
      window.dispatchEvent(new CustomEvent("mana_notifications_updated"));
      window.dispatchEvent(new CustomEvent("mana_registrations_updated"));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to respond to invitation");
    } finally {
      setRespondingInviteId(null);
    }
  };

  const handleSavePartner = async () => {
    if (!partnerModalState.registration) return;
    const regId = partnerModalState.registration.id;
    setPartnerModalState(prev => ({ ...prev, saving: true }));
    try {
      const partnerUserId = partnerModalState.selectedPartner?.userId || null;
      await sportsService.nominatePartner(regId, partnerUserId);
      toast.success(
        partnerUserId
          ? `Partner invitation sent to ${partnerModalState.selectedPartner?.name || "partner"}!`
          : "Registered in Open Pairing Pool. You'll be matched with a partner soon."
      );
      setRegistrations(prev => prev.map(r => {
        if (r.id === regId) {
          return {
            ...r,
            partnerUserId,
            partnerName: partnerModalState.selectedPartner?.name || (partnerUserId ? "Nominated Partner" : null),
            partnerStatus: partnerUserId ? "PENDING" : "LOOKING_FOR_PARTNER",
          };
        }
        return r;
      }));
      setPartnerModalState({ open: false, registration: null, selectedPartner: null, saving: false });
      window.dispatchEvent(new CustomEvent("mana_registrations_updated"));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update partner");
      setPartnerModalState(prev => ({ ...prev, saving: false }));
    }
  };

  const handleSaveCaptainNomination = async () => {
    if (!captainModalState.registration) return;
    const reg = captainModalState.registration;
    const willNominate = captainModalState.nominated;
    const teamName = captainModalState.teamName.trim() || undefined;

    setCaptainModalState(prev => ({ ...prev, saving: true }));
    try {
      await sportsService.nominateCaptain(reg.id, willNominate, teamName);
      if (reg.eventId) {
        await auctionService.nominateCaptain(reg.eventId, willNominate, teamName).catch(() => {});
      }

      toast.success(
        willNominate
          ? "Captain self-nomination submitted! Good luck for the team selection."
          : "Captain nomination withdrawn."
      );

      setRegistrations(prev => prev.map(r => {
        if (r.id === reg.id) {
          return {
            ...r,
            captainNomination: willNominate,
          };
        }
        return r;
      }));

      setCaptainModalState({ open: false, registration: null, nominated: false, teamName: "", saving: false });
      window.dispatchEvent(new CustomEvent("mana_registrations_updated"));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update captain nomination");
      setCaptainModalState(prev => ({ ...prev, saving: false }));
    }
  };

  const handleSavePassport = () => {
    safeStorage.setItem("mana_player_sports_passport", JSON.stringify(passport));
    setPassportSaved(true);
    toast.success("Player Settings saved successfully!");
    setTimeout(() => setPassportSaved(false), 2500);
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success("Community code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const myCommunity = communities.find(c => c.id === user?.communityId);
  const sportNames = Array.from(new Set(registrations.map(r => r.sportName).filter(Boolean))) as string[];

  // Performance calculations
  const totalMatches = myMatches.length;

  const xpPoints = (registrations.length * 150) + (teams.length * 200) + (myMatches.length * 100) + 100;
  const playerLevel = Math.floor(xpPoints / 400) + 1;
  const levelProgress = Math.min(100, Math.round(((xpPoints % 400) / 400) * 100));

  const achievements = ACHIEVEMENT_DEFS.map(a => ({
    ...a,
    unlocked: a.check(registrations.length, teams.length, myMatches.length, true),
  }));
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Filtered Tournaments
  const filteredTournaments = useMemo(() => {
    return registrations.filter(r => {
      const nameMatch = (r.eventName || "").toLowerCase().includes(tournamentSearch.toLowerCase()) ||
                         (r.sportName || "").toLowerCase().includes(tournamentSearch.toLowerCase()) ||
                         (r.categoryName || "").toLowerCase().includes(tournamentSearch.toLowerCase());
      const sportMatch = tournamentSportFilter === "All" || (r.sportName || "").toLowerCase() === tournamentSportFilter.toLowerCase();
      const statusMatch = tournamentStatusFilter === "All" || r.status === tournamentStatusFilter;
      return nameMatch && sportMatch && statusMatch;
    });
  }, [registrations, tournamentSearch, tournamentSportFilter, tournamentStatusFilter]);

  // Next Upcoming Match
  const nextMatch = myMatches.length > 0 ? myMatches[0] : null;

  return (
    <div className="auction-hub-wrapper animate-fade-in-up stagger-1">
      <Toaster position="top-center" richColors />

      {/* Sidebar Hub Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-wrapper">
            <Trophy className="brand-icon" />
          </div>
          <div className="brand-title">My Sports Hub</div>
        </div>
        <div className="nav-section">
          <div className="nav-label">Hub Menu</div>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="nav-icon" size={16} />
                <span className="nav-text flex items-center justify-between flex-1">
                  {tab.label}
                  {tab.id === "tournaments" && partnerInvitations.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-black rounded-full animate-pulse">
                      {partnerInvitations.length}
                    </span>
                  )}
                  {tab.id === "settings" && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 font-bold ml-1">
                      PRO
                    </span>
                  )}
                </span>
                <div className="active-indicator" />
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        <div className="page active space-y-3 sm:space-y-6">
          {/* Header */}
          <div className="page-hdr hidden sm:flex items-center justify-between">
            <div className="hidden sm:block">
              <div className="page-title">{TABS.find(t => t.id === activeTab)?.label}</div>
              <div className="page-sub">Personal athlete command center, fixtures, team rosters, and settings</div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/sports/schedule"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Fixtures & Schedule</span>
              </Link>
            </div>
          </div>

          {/* Player Identity Card */}
          <div className="rounded-xl sm:rounded-2xl p-3 sm:p-6 bg-white border border-[#6366f1]/12 shadow-[0_4px_20px_rgba(99,102,241,0.05)] text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6">
              {/* Left: Avatar & Bio */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <div
                    className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-base sm:text-xl font-extrabold shrink-0 shadow-lg shadow-indigo-500/20"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    {userInitials}
                  </div>
                  <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white shadow-xs">
                    #{passport.jerseyNumber || "7"}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-extrabold text-sm sm:text-xl text-[#0d0d2b] leading-tight">
                      {displayName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {passport.skillLevel}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-[#6b7094] mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-indigo-600 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {myCommunity?.name ?? "Community Member"}
                    </span>
                    <span>•</span>
                    <span className="text-slate-500 font-medium">
                      {passport.dominantHand}-Handed • {passport.primarySport.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right: Quick Counters & Action */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-8 justify-between md:justify-end flex-1">
                <div className="flex items-center gap-3 sm:gap-6">
                  {[
                    { label: "Teams", value: teams.length.toString(), color: "#6366f1" },
                    { label: "Registrations", value: registrations.length.toString(), color: "#10b981" },
                    { label: "Matches", value: myMatches.length.toString(), color: "#f59e0b" },
                    { label: "Athlete Level", value: `Lvl ${playerLevel}`, color: "#8b5cf6" },
                  ].map((s) => (
                    <div key={s.label} className="text-left md:text-center">
                      <p className="font-extrabold text-sm sm:text-lg text-[#0d0d2b]" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[8px] sm:text-[10px] uppercase tracking-wider font-semibold text-[#6b7094]">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all hover:bg-indigo-500/10 active:scale-[0.96] cursor-pointer"
                    style={{ background: "rgba(99,102,241,0.08)", color: "#4f46e5", border: "1px solid rgba(99,102,241,0.2)" }}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Grid: Active Tab Panel (Left 2/3) + Performance Hub (Right 1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-5">
              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl bg-white border border-[rgba(99,102,241,0.1)] shadow-sm">
                  <Loader2 className="w-8 h-8 text-[#4f46e5] animate-spin" />
                  <p className="text-xs text-[#6b7094]">Loading your athlete hub...</p>
                </div>
              ) : (
                <>
                  {/* ════════════════════ OVERVIEW TAB ════════════════════ */}
                  {activeTab === "overview" && (
                    <div className="space-y-3 sm:space-y-5 text-left animate-fade-in-up">
                      {/* Hero Welcome Banner */}
                      <div
                        className="rounded-2xl sm:rounded-3xl py-3 px-4 sm:py-4 sm:px-6 text-white relative overflow-hidden shadow-lg border border-indigo-500/10"
                        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)" }}
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                          <Trophy className="w-16 h-16 sm:w-28 sm:h-28 rotate-12" />
                        </div>
                        <div className="max-w-xl relative z-10 space-y-1">
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-widest uppercase bg-indigo-500/30 border border-indigo-400/20 text-indigo-200 inline-block">
                            Athlete Command Center
                          </span>
                          <h2 className="text-sm sm:text-lg md:text-xl font-extrabold tracking-tight">
                            Welcome back, {displayName}!
                          </h2>
                          <p className="text-[10px] sm:text-xs text-indigo-200 leading-relaxed max-w-lg">
                            Track match draws, manage doubles partnerships, review team lineups, and update your player settings.
                          </p>
                        </div>
                      </div>

                      {/* Quick Action Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Link
                          to="/sports/register"
                          className="p-2.5 sm:p-3 min-h-[56px] bg-white hover:bg-indigo-50/40 rounded-xl border border-slate-200/70 shadow-xs hover:shadow-sm active:scale-95 transition-all text-left flex items-center gap-2 sm:gap-2.5 group"
                        >
                          <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Plus className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[13px] sm:text-xs font-bold text-slate-800">Register</p>
                            <p className="text-[11px] sm:text-[9px] text-slate-400">Join sport</p>
                          </div>
                        </Link>

                        <Link
                          to="/sports/schedule"
                          className="p-2.5 sm:p-3 min-h-[56px] bg-white hover:bg-emerald-50/40 rounded-xl border border-slate-200/70 shadow-xs hover:shadow-sm active:scale-95 transition-all text-left flex items-center gap-2 sm:gap-2.5 group"
                        >
                          <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[13px] sm:text-xs font-bold text-slate-800">Schedule</p>
                            <p className="text-[11px] sm:text-[9px] text-slate-400">View draws</p>
                          </div>
                        </Link>

                        <Link
                          to="/sports/analytics"
                          className="p-2.5 sm:p-3 min-h-[56px] bg-white hover:bg-amber-50/40 rounded-xl border border-slate-200/70 shadow-xs hover:shadow-sm active:scale-95 transition-all text-left flex items-center gap-2 sm:gap-2.5 group"
                        >
                          <div className="p-1.5 sm:p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[13px] sm:text-xs font-bold text-slate-800">Leaderboard</p>
                            <p className="text-[11px] sm:text-[9px] text-slate-400">Standings</p>
                          </div>
                        </Link>

                        <button
                          onClick={() => setActiveTab("settings")}
                          className="p-2.5 sm:p-3 min-h-[56px] bg-white hover:bg-purple-50/40 rounded-xl border border-slate-200/70 shadow-xs hover:shadow-sm active:scale-95 transition-all text-left flex items-center gap-2 sm:gap-2.5 group cursor-pointer"
                        >
                          <div className="p-1.5 sm:p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Settings className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[13px] sm:text-xs font-bold text-slate-800">Settings</p>
                            <p className="text-[11px] sm:text-[9px] text-slate-400">Player profile</p>
                          </div>
                        </button>
                      </div>

                      {/* Pending Doubles Partner Invitations */}
                      {partnerInvitations.length > 0 && (
                        <div className="bg-amber-50/90 border border-amber-300 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2.5 shadow-sm">
                          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
                                <Users className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <h3 className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center gap-1.5">
                                  Pending Doubles Partner Invitations
                                  <span className="px-1.5 py-0.2 bg-amber-600 text-white text-[9px] font-black rounded-full">
                                    {partnerInvitations.length} new
                                  </span>
                                </h3>
                                <p className="text-[10px] sm:text-[11px] text-amber-800">
                                  You have been nominated as a doubles partner for the following event(s):
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {partnerInvitations.map((inv) => {
                              const invId = inv.id;
                              const pName = inv.playerName || inv.user?.fullName || "A player";
                              const evName = inv.eventName || inv.event?.name || "Doubles Tournament";
                              const spName = inv.sportName || inv.event?.sport?.name || "Doubles Match";
                              const catName = inv.categoryName || inv.category?.name;
                              const isBusy = respondingInviteId === invId;

                              return (
                                <div key={invId} className="bg-white border border-amber-200 rounded-xl p-3 flex flex-col justify-between gap-2.5 shadow-xs">
                                  <div>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[9px] uppercase font-black tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                        {spName}
                                      </span>
                                      <span className="text-[8.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                        Action Required
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                                      {evName}
                                    </h4>
                                    <p className="text-[10.5px] text-slate-600 mt-0.5">
                                      <strong className="text-slate-900 font-semibold">{pName}</strong> nominated you to play as their doubles partner.
                                    </p>
                                    {catName && (
                                      <div className="mt-1.5 text-[9.5px] font-semibold text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                                        {catName}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleRespondInvitation(invId, true)}
                                      className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 min-h-[40px] sm:min-h-0 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[12px] sm:text-[11px] font-bold rounded-lg transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>{isBusy ? "Confirming..." : "Accept Partner"}</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleRespondInvitation(invId, false)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 min-h-[40px] sm:min-h-0 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 text-[12px] sm:text-[11px] font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Decline</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Next Upcoming Match Hero Card */}
                      {nextMatch && (
                        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-md border border-indigo-500/20 space-y-2 sm:space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 text-[9px] sm:text-[9px] font-extrabold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                              Next Up On Court
                            </span>
                            <span className="text-[11px] sm:text-xs text-indigo-200 font-mono font-bold">
                              {nextMatch.eventDateStart ? new Date(nextMatch.eventDateStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Scheduled"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 sm:gap-4">
                            <div className="space-y-0.5 sm:space-y-1 min-w-0">
                              <p className="text-[10px] sm:text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{nextMatch.sportName || "Tournament"}</p>
                              <h3 className="text-[13px] sm:text-base font-extrabold text-white leading-snug truncate">{nextMatch.name}</h3>
                              <p className="text-[11px] text-slate-300 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400 shrink-0" />
                                <span className="truncate">{nextMatch.venueName || "Main Sports Complex"}{nextMatch.venueCity ? `, ${nextMatch.venueCity}` : ""}</span>
                              </p>
                            </div>

                            <Link
                              to="/sports/schedule"
                              className="px-2.5 sm:px-3 py-2 min-h-[40px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] sm:text-xs font-bold transition shadow-md shadow-indigo-600/30 shrink-0 flex items-center"
                            >
                              View Fixture →
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Two Column Section: Upcoming Matches + Active Registrations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {/* Upcoming Matches Preview */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-100 shadow-sm space-y-2 sm:space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h3 className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-indigo-500" />
                              Match Timeline
                            </h3>
                            <button onClick={() => setActiveTab("matches")} className="text-[11px] sm:text-[10px] font-bold text-indigo-600 hover:text-indigo-800 min-h-[32px] flex items-center">
                              View All ({myMatches.length}) →
                            </button>
                          </div>

                          <div className="space-y-1.5 sm:space-y-2">
                            {myMatches.length === 0 ? (
                              <div className="text-center py-6 text-slate-400 text-[13px] sm:text-xs">
                                No scheduled matches yet.
                              </div>
                            ) : (
                              myMatches.slice(0, 3).map((m) => (
                                <div key={m.id} className="p-2 sm:p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <span className="text-[9px] sm:text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.2 rounded font-bold uppercase">
                                      {m.sportName}
                                    </span>
                                    <h4 className="text-[13px] sm:text-xs font-bold text-slate-800 mt-0.5 truncate">{m.name}</h4>
                                    <p className="text-[11px] sm:text-[10px] text-slate-400 truncate">{m.venueName || "Venue TBD"}</p>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-1.5 sm:px-2 py-1 rounded-lg border border-slate-200 shrink-0">
                                    {m.eventDateStart ? new Date(m.eventDateStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Active Registrations Preview */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-100 shadow-sm space-y-2 sm:space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h3 className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Trophy className="w-3.5 h-3.5 text-amber-500" />
                              Tournaments
                            </h3>
                            <button onClick={() => setActiveTab("tournaments")} className="text-[11px] sm:text-[10px] font-bold text-indigo-600 hover:text-indigo-800 min-h-[32px] flex items-center">
                              Manage ({registrations.length}) →
                            </button>
                          </div>

                          <div className="space-y-1.5 sm:space-y-2">
                            {registrations.length === 0 ? (
                              <div className="text-center py-6 text-slate-400 text-[13px] sm:text-xs">
                                No active registrations.
                              </div>
                            ) : (
                              registrations.slice(0, 3).map((reg) => {
                                const isConfirmed = reg.status === "CONFIRMED" || reg.status === "REGISTERED";
                                return (
                                  <div key={reg.id} className="p-2 sm:p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <span className="text-[9px] sm:text-[8px] font-bold uppercase tracking-wider text-slate-400">{reg.sportName}</span>
                                      <h4 className="text-[13px] sm:text-xs font-bold text-slate-800 truncate">{reg.eventName}</h4>
                                      <p className="text-[10px] sm:text-[9px] text-slate-500">{reg.categoryName || "Open Category"}</p>
                                    </div>
                                    <span className={`text-[9px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                      isConfirmed ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                      "bg-yellow-50 text-yellow-600 border border-yellow-100"
                                    }`}>
                                      {reg.status}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════════════════════ MY TOURNAMENTS TAB ════════════════════ */}
                  {activeTab === "tournaments" && (
                    <div className="space-y-4 text-left animate-fade-in-up">
                      {/* Search & Filter Bar */}
                      <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center justify-between">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 sm:py-1.5 w-full sm:w-72">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            placeholder="Search tournament, sport..."
                            value={tournamentSearch}
                            onChange={e => setTournamentSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-[13px] sm:text-xs text-slate-800 placeholder-slate-400 w-full"
                          />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                          <select
                            value={tournamentSportFilter}
                            onChange={e => setTournamentSportFilter(e.target.value)}
                            className="text-[13px] sm:text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 sm:py-1.5 font-semibold text-slate-700 outline-none flex-1 sm:flex-none min-h-[40px] sm:min-h-0"
                          >
                            <option value="All">All Sports</option>
                            {ALL_SPORTS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </select>

                          <select
                            value={tournamentStatusFilter}
                            onChange={e => setTournamentStatusFilter(e.target.value)}
                            className="text-[13px] sm:text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 sm:py-1.5 font-semibold text-slate-700 outline-none flex-1 sm:flex-none min-h-[40px] sm:min-h-0"
                          >
                            <option value="All">All Statuses</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="REGISTERED">Registered</option>
                            <option value="PENDING">Pending</option>
                            <option value="WITHDRAWN">Withdrawn</option>
                          </select>
                        </div>
                      </div>

                      {filteredTournaments.length === 0 ? (
                        <div className="text-center py-8 sm:py-16 bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-6 space-y-2.5 sm:space-y-3">
                          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-800 text-[13px] sm:text-sm">No tournament registrations found</p>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Browse upcoming society tournaments and sports leagues to sign up and start playing.
                          </p>
                          <Link
                            to="/sports/register"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-100"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Browse & Register</span>
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          {filteredTournaments.map(reg => {
                            const isConfirmed = reg.status === "CONFIRMED" || reg.status === "REGISTERED";

                            return (
                              <div
                                key={reg.id}
                                className="p-2.5 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between gap-2.5 sm:gap-3 text-left"
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-[10px] sm:text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                      {reg.sportName || "Sports Event"}
                                    </span>
                                    <span className={`text-[9px] sm:text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      isConfirmed ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                      reg.status === "WITHDRAWN" ? "bg-red-50 text-red-600 border border-red-200" :
                                      "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                    }`}>
                                      {reg.status}
                                    </span>
                                  </div>

                                  <h4 className="text-[13px] sm:text-sm font-bold text-slate-900 mt-1.5 leading-snug">{reg.eventName}</h4>

                                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
                                    {reg.matchType && (
                                      <span className="text-[10px] sm:text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 sm:px-2 py-0.5 rounded font-bold capitalize">
                                        {reg.matchType.replace(/_/g, " ").toLowerCase()}
                                      </span>
                                    )}
                                    {reg.categoryName && (
                                      <span className="text-[10px] sm:text-[9px] bg-slate-100 text-slate-700 px-1.5 sm:px-2 py-0.5 rounded font-semibold">
                                        {reg.categoryName}
                                      </span>
                                    )}
                                    {reg.flatNumber && (
                                      <span className="text-[10px] sm:text-[9px] bg-slate-100 text-slate-700 px-1.5 sm:px-2 py-0.5 rounded font-semibold">
                                        Flat: {reg.flatNumber}
                                      </span>
                                    )}
                                    {reg.captainNomination && (
                                      <span className="text-[10px] sm:text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 sm:px-2 py-0.5 rounded font-bold">
                                        Captain Nominee
                                      </span>
                                    )}
                                  </div>

                                  {/* Doubles / Mixed Doubles Partner Info */}
                                  {((reg.matchType && reg.matchType.toUpperCase().includes("DOUBLES")) ||
                                    (reg.eventName && reg.eventName.toLowerCase().includes("doubles")) ||
                                    (reg.categoryName && reg.categoryName.toLowerCase().includes("doubles"))) && (
                                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                                      {reg.partnerUserId || reg.partnerName ? (
                                        <div className="flex items-center gap-1.5">
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 border ${
                                            reg.partnerStatus === "CONFIRMED" || reg.partnerStatus === "ACCEPTED"
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                              : reg.partnerStatus === "REJECTED" || reg.partnerStatus === "DECLINED"
                                              ? "bg-rose-50 text-rose-700 border-rose-200"
                                              : "bg-amber-50 text-amber-700 border-amber-200"
                                          }`}>
                                            <Users className="w-3 h-3" />
                                            <span>
                                              Partner: <strong>{reg.partnerName || "Partner"}</strong>
                                            </span>
                                            <span className="text-[9px] font-medium opacity-80">
                                              ({reg.partnerStatus === "CONFIRMED" || reg.partnerStatus === "ACCEPTED" ? "Confirmed" : reg.partnerStatus === "REJECTED" || reg.partnerStatus === "DECLINED" ? "Declined" : "Invited"})
                                            </span>
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200">
                                            <Sparkles className="w-3 h-3 text-purple-600" />
                                            <span>Open Pairing Pool</span>
                                          </span>
                                        </div>
                                      )}

                                      {["PENDING", "REGISTERED", "CONFIRMED"].includes(reg.status) && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setPartnerModalState({
                                              open: true,
                                              registration: reg,
                                              selectedPartner: reg.partnerUserId ? {
                                                userId: reg.partnerUserId,
                                                name: reg.partnerName || undefined,
                                                mode: "community",
                                              } : null,
                                              saving: false,
                                            });
                                          }}
                                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer border border-indigo-200"
                                        >
                                          <HeartHandshake className="w-3 h-3 text-indigo-600" />
                                          <span>{reg.partnerUserId ? "Change Partner" : "Nominate Partner"}</span>
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {/* Team Captain Status & Action (for Cricket and Team Sports) */}
                                  {(isTeamSport(reg.eventName || "") || reg.matchType === "TEAM") && (
                                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 border ${
                                          reg.captainConfirmation
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : reg.captainNomination
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-slate-50 text-slate-600 border-slate-200"
                                        }`}>
                                          <Crown className="w-3 h-3 text-amber-600" />
                                          <span>
                                            {reg.captainConfirmation
                                              ? "Confirmed Captain 🏆"
                                              : reg.captainNomination
                                              ? "Captain Nominee"
                                              : "Captaincy: Not Nominated"}
                                          </span>
                                        </span>
                                      </div>

                                      {["PENDING", "REGISTERED", "CONFIRMED"].includes(reg.status) && !reg.captainConfirmation && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCaptainModalState({
                                              open: true,
                                              registration: reg,
                                              nominated: !!reg.captainNomination,
                                              teamName: "",
                                              saving: false,
                                            });
                                          }}
                                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer border border-amber-200"
                                        >
                                          <Crown className="w-3 h-3 text-amber-600" />
                                          <span>{reg.captainNomination ? "Manage Captaincy" : "Nominate as Captain"}</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="border-t border-slate-100 pt-2 sm:pt-3 flex items-center justify-between gap-2 text-xs">
                                  <div className="text-[11px] sm:text-[10px] text-slate-400 font-medium">
                                    {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : "Active"}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <Link
                                      to="/sports/schedule"
                                      className="px-2.5 py-1.5 sm:py-1 min-h-[36px] sm:min-h-0 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-[10px] font-bold rounded-lg transition flex items-center"
                                    >
                                      Draws & Fixtures
                                    </Link>
                                    {["PENDING", "REGISTERED"].includes(reg.status) && (
                                      <button
                                        onClick={() => handleWithdraw(reg.id)}
                                        className="p-1.5 sm:p-1 min-h-[36px] sm:min-h-0 min-w-[36px] sm:min-w-0 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                        title="Withdraw registration"
                                      >
                                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ════════════════════ MY COMMUNITY TAB ════════════════════ */}
                  {activeTab === "community" && (
                    <div className="space-y-4 text-left animate-fade-in-up">
                      {!myCommunity ? (
                        <div className="text-center py-6 sm:py-12 bg-white rounded-2xl border border-slate-100 p-3 sm:p-6 shadow-sm">
                          <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2.5 sm:mb-3" />
                          <p className="font-bold text-slate-800 text-[13px] sm:text-sm">No community selected</p>
                          <p className="text-xs text-slate-500 mt-1">Please select or link your apartment/society in your profile.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Community Info Card */}
                          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-sm space-y-3 sm:space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 sm:pb-3 gap-2">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="p-2 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl shrink-0">
                                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="text-[13px] sm:text-base font-extrabold text-slate-900 truncate">{myCommunity.name}</h3>
                                  <span className="text-[9px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                                    {myCommunity.type} Community
                                  </span>
                                </div>
                              </div>

                              {myCommunity.code && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyInviteCode(myCommunity.code || "")}
                                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 min-h-[36px] sm:min-h-0 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold transition cursor-pointer shrink-0"
                                >
                                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedCode ? "Copied!" : myCommunity.code}</span>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                              <div>
                                <span className="text-slate-400 font-semibold uppercase text-[10px] sm:text-[9px] tracking-wider">Classification</span>
                                <p className="font-bold text-slate-800 mt-0.5 text-[13px] sm:text-xs">{myCommunity.subtype || "Residential Gated Society"}</p>
                              </div>
                              <div>
                                <span className="text-slate-400 font-semibold uppercase text-[10px] sm:text-[9px] tracking-wider">Location / City</span>
                                <p className="font-bold text-slate-800 mt-0.5">
                                  {myCommunity.area ? `${myCommunity.area}, ` : ""}{myCommunity.city || "Bangalore"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Community Sports Facilities / Venues */}
                          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-100 shadow-sm space-y-2.5 sm:space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-2.5">
                              <h3 className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                                <span className="hidden sm:inline">Community Sports Facilities & Venues ({venues.length})</span>
                                <span className="sm:hidden">Venues ({venues.length})</span>
                              </h3>
                              <span className="text-[10px] text-slate-400 font-medium">Auto-synced</span>
                            </div>

                            {venues.length === 0 ? (
                              <div className="text-center py-6 text-slate-400 text-xs">
                                No sports grounds or courts registered in this community yet.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                {venues.map(v => (
                                  <div key={v.id} className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className="text-[13px] sm:text-xs font-bold text-slate-800 truncate">{v.name}</h4>
                                      <span className="text-[9px] sm:text-[8px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 uppercase shrink-0">
                                        Active
                                      </span>
                                    </div>
                                    <p className="text-[11px] sm:text-[10px] text-slate-500 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                                      <span className="truncate">{v.address || "Society Clubhouse Sports Wing"}</span>
                                    </p>
                                    {v.capacity && (
                                      <p className="text-[10px] sm:text-[9px] text-slate-400 font-medium">Capacity: {v.capacity} players</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ════════════════════ MY TEAMS TAB ════════════════════ */}
                  {activeTab === "teams" && (
                    <div className="space-y-4 text-left animate-fade-in-up">
                      {teams.length === 0 ? (
                        <div className="text-center py-8 sm:py-16 bg-white rounded-2xl border border-slate-100 p-3 sm:p-6 shadow-sm space-y-2.5 sm:space-y-3">
                          <Users className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-800 text-[13px] sm:text-sm">No auction / league teams found</p>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            You will see your squads here once player auctions or team drafts are completed.
                          </p>
                          <Link
                            to="/sports/auction"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-100"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Go to Player Auction</span>
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {teams.map(team => {
                            const total = team.totalBudget || 1000;
                            const spent = team.spent || 0;
                            const remaining = team.remainingBudget || (total - spent);
                            const percent = Math.min(100, Math.round((spent / total) * 100));

                            return (
                              <div
                                key={team.id}
                                className="p-3 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition space-y-3 sm:space-y-3.5"
                              >
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 sm:pb-3 gap-2">
                                  <div className="min-w-0">
                                    <h4 className="text-[13px] sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5 truncate">
                                      {team.emoji || "🛡️"} {team.teamName}
                                    </h4>
                                    <span className="text-[11px] sm:text-[10px] text-slate-400 font-semibold block mt-0.5 truncate">
                                      Owner: {team.ownerName || "Community Franchise"}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] sm:text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide shrink-0 ${
                                    team.captainConfirmation ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-indigo-50 text-indigo-600 border border-indigo-200"
                                  }`}>
                                    {team.captainConfirmation ? "Captain" : "Squad"}
                                  </span>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-[13px] sm:text-xs font-semibold text-slate-600">
                                    <span>Budget Spent</span>
                                    <span>₹{spent.toLocaleString()} / ₹{total.toLocaleString()}</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[11px] sm:text-[10px] font-bold text-slate-400">
                                    <span>{percent}% utilized</span>
                                    <span className="text-emerald-600">Remaining: ₹{remaining.toLocaleString()}</span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-[11px] sm:text-[10px] text-slate-400 font-medium">Roster Active</span>
                                  <Link
                                    to="/sports/auction"
                                    className="text-[13px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 min-h-[36px] sm:min-h-0"
                                  >
                                    <span>Team Details</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ════════════════════ MY MATCHES TAB ════════════════════ */}
                  {activeTab === "matches" && (
                    <div className="space-y-4 text-left animate-fade-in-up">
                      {myMatches.length === 0 ? (
                        <div className="text-center py-8 sm:py-16 bg-white rounded-2xl border border-slate-100 p-3 sm:p-6 shadow-sm space-y-2.5 sm:space-y-3">
                          <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-800 text-[13px] sm:text-sm">No scheduled matches found</p>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Matches will appear in your timeline as soon as tournament brackets and round-robin draws are published.
                          </p>
                          <Link
                            to="/sports/schedule"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-100"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>View All Tournament Fixtures</span>
                          </Link>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-100 shadow-sm space-y-3 sm:space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-3">
                            <h3 className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">
                              My Match Timeline ({myMatches.length})
                            </h3>
                            <Link
                              to="/sports/schedule"
                              className="text-[11px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-800 min-h-[32px] flex items-center"
                            >
                              Match Center →
                            </Link>
                          </div>

                          <div className="space-y-2.5 sm:space-y-3">
                            {myMatches.map((m, i) => (
                              <div
                                key={m.id}
                                className="relative flex gap-2.5 sm:gap-3.5 pb-3 sm:pb-4 border-b border-slate-100 last:border-b-0 last:pb-0"
                              >
                                <div className="flex flex-col items-center">
                                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-indigo-600 shrink-0 mt-1 shadow-xs shadow-indigo-400" />
                                  {i < myMatches.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] sm:text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-1.5 sm:px-2 py-0.5 rounded">
                                      {m.sportName || "Sport"}
                                    </span>
                                    <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-700">
                                      {m.eventDateStart ? new Date(m.eventDateStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Scheduled"}
                                    </span>
                                  </div>

                                  <h4 className="text-[13px] sm:text-sm font-extrabold text-slate-900 mt-1 truncate">{m.name}</h4>

                                  <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-500 shrink-0" />
                                    <span className="truncate">{m.venueName || "Main Arena"}{m.venueCity ? `, ${m.venueCity}` : ""}</span>
                                  </div>

                                  <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-2.5 flex-wrap">
                                    <span className="text-[10px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-700">
                                      {m.format?.[0] || "Tournament Fixture"}
                                    </span>
                                    <span className="text-[10px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {m.registrationStatus || "CONFIRMED"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ════════════════════ SETTINGS TAB ════════════════════ */}
                  {activeTab === "settings" && (
                    <div className="space-y-4 text-left animate-fade-in-up">
                      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-sm space-y-4 sm:space-y-5">
                        <div className="border-b border-slate-100 pb-2.5 sm:pb-3">
                          <h3 className="text-[13px] sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                            <span>Player Settings & Preferences</span>
                          </h3>
                          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                            Set your playing tier, preferred roles, and jersey preferences.
                          </p>
                        </div>

                        {/* Skill Tier Selector */}
                        <div className="space-y-2">
                          <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider block">
                            Athlete Skill Tier
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {SKILL_LEVELS.map(level => {
                              const isSelected = passport.skillLevel === level.id;
                              return (
                                <button
                                  type="button"
                                  key={level.id}
                                  onClick={() => setPassport(p => ({ ...p, skillLevel: level.id }))}
                                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                                      : "border-slate-200 bg-white hover:border-slate-300"
                                  }`}
                                >
                                  <span className="text-[11px] sm:text-[10px] font-extrabold block" style={{ color: level.color }}>
                                    {level.badge}
                                  </span>
                                  <p className="text-[13px] sm:text-xs font-bold text-slate-900 mt-0.5">{level.label}</p>
                                  <p className="text-[10px] sm:text-[9px] text-slate-500 mt-0.5 leading-snug">{level.desc}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Playing Attributes */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                          <div>
                            <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                              Dominant Hand
                            </label>
                            <select
                              value={passport.dominantHand}
                              onChange={e => setPassport(p => ({ ...p, dominantHand: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 sm:py-2 text-[13px] sm:text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 min-h-[44px] sm:min-h-0"
                            >
                              <option value="Right">Right-Handed</option>
                              <option value="Left">Left-Handed</option>
                              <option value="Ambidextrous">Ambidextrous</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                              Jersey Number
                            </label>
                            <input
                              type="text"
                              maxLength={3}
                              value={passport.jerseyNumber}
                              onChange={e => setPassport(p => ({ ...p, jerseyNumber: e.target.value }))}
                              placeholder="e.g. 7 or 10"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 sm:py-2 text-[13px] sm:text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 min-h-[44px] sm:min-h-0"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                              Jersey Name
                            </label>
                            <input
                              type="text"
                              value={passport.jerseyName}
                              onChange={e => setPassport(p => ({ ...p, jerseyName: e.target.value }))}
                              placeholder="e.g. SANDEEP"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 sm:py-2 text-[13px] sm:text-xs font-semibold text-slate-800 uppercase outline-none focus:border-indigo-500 min-h-[44px] sm:min-h-0"
                            />
                          </div>
                        </div>

                        {/* Preferred Roles per Sport */}
                        <div className="space-y-2.5">
                          <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider block">
                            Preferred Role per Sport
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            {ALL_SPORTS.slice(0, 4).map(s => (
                              <div key={s.id} className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5">
                                <span className="text-[13px] sm:text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <span>{s.icon}</span>
                                  <span>{s.name}</span>
                                </span>
                                <select
                                  value={passport.sportRoles[s.id] || s.roles[0]}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setPassport(p => ({ ...p, sportRoles: { ...p.sportRoles, [s.id]: val } }));
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 sm:py-1.5 text-[13px] sm:text-xs font-semibold text-slate-700 outline-none min-h-[40px] sm:min-h-0"
                                >
                                  {s.roles.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Availability Preferences */}
                        <div className="space-y-2">
                          <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider block">
                            Match Availability
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {["Weekends", "Weekday Evenings", "Weekday Mornings"].map(slot => {
                              const active = passport.preferredSlots.includes(slot);
                              return (
                                <button
                                  type="button"
                                  key={slot}
                                  onClick={() => {
                                    setPassport(p => ({
                                      ...p,
                                      preferredSlots: active
                                        ? p.preferredSlots.filter(s => s !== slot)
                                        : [...p.preferredSlots, slot],
                                    }));
                                  }}
                                  className={`px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-xl text-[13px] sm:text-xs font-bold border transition cursor-pointer ${
                                    active
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  {active ? "✓ " : "+ "}{slot}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Save Action */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-0">
                          <p className="text-[11px] sm:text-[10px] text-slate-400 hidden sm:block">
                            Saved to your athlete settings.
                          </p>
                          <button
                            type="button"
                            onClick={handleSavePassport}
                            className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] sm:min-h-0 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[13px] sm:text-xs font-extrabold rounded-xl transition shadow-md shadow-indigo-100 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {passportSaved ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                            <span>{passportSaved ? "Saved!" : "Save Settings"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Column: Performance, Achievements & Level Hub */}
            <div className="space-y-3 sm:space-y-5 text-left">
              {/* Athlete Performance Hub */}
              <div
                className="rounded-2xl p-3.5 sm:p-5 bg-white border border-slate-100 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span>My Activity</span>
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <div className="p-2 sm:p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-center">
                    <p className="text-lg sm:text-xl font-extrabold text-indigo-600">{registrations.length}</p>
                    <p className="text-[9px] sm:text-[9px] font-bold text-slate-600 uppercase tracking-wider">Registered</p>
                  </div>
                  <div className="p-2 sm:p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center">
                    <p className="text-lg sm:text-xl font-extrabold text-emerald-600">{teams.length}</p>
                    <p className="text-[9px] sm:text-[9px] font-bold text-slate-600 uppercase tracking-wider">Teams</p>
                  </div>
                  <div className="p-2 sm:p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
                    <p className="text-lg sm:text-xl font-extrabold text-amber-600">{totalMatches}</p>
                    <p className="text-[9px] sm:text-[9px] font-bold text-slate-600 uppercase tracking-wider">Matches</p>
                  </div>
                </div>
              </div>

              {/* Player Level & XP Progress */}
              <div className="rounded-xl sm:rounded-2xl p-3 sm:p-5 bg-white border border-slate-100 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[13px] sm:text-xs font-bold text-slate-900">Level {playerLevel}</h4>
                    <p className="text-[11px] sm:text-[10px] text-slate-400">{xpPoints} XP</p>
                  </div>
                  <span className="text-[13px] sm:text-xs font-extrabold text-indigo-600">{levelProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
              </div>

              {/* Achievements Badges */}
              <div className="rounded-xl sm:rounded-2xl p-3 sm:p-5 bg-white border border-slate-100 shadow-sm space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-[13px] sm:text-sm text-slate-900">Achievements</h3>
                  <span className="text-[11px] sm:text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                    {unlockedCount}/{achievements.length}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-2 gap-1.5 sm:gap-2">
                  {achievements.map((a) => (
                    <div
                      key={a.id}
                      className={`p-2 sm:p-2.5 rounded-xl text-center flex flex-col justify-between border transition-all ${
                        a.unlocked
                          ? "bg-slate-50 border-slate-200/80 shadow-2xs"
                          : "bg-slate-50/50 border-slate-100 opacity-50"
                      }`}
                    >
                      <div
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1"
                        style={{ background: a.unlocked ? `${a.color}15` : "rgba(107,112,148,0.08)" }}
                      >
                        <a.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: a.unlocked ? a.color : "#9ca3af" }} />
                      </div>
                      <p className="text-[10px] sm:text-[10px] font-bold text-slate-800 leading-tight">{a.title}</p>
                      <p className="text-[8px] sm:text-[8px] text-slate-400 mt-0.5 hidden sm:block">{a.desc}</p>
                      {a.unlocked && (
                        <CheckCircle className="h-3 w-3 mx-auto mt-0.5 sm:mt-1" style={{ color: a.color }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Auction Callout */}
              <div
                className="rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white space-y-1.5 sm:space-y-2 relative overflow-hidden shadow-md"
                style={{ background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)" }}
              >
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-white" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-100">Live Hub</span>
                </div>
                <h3 className="font-extrabold text-[13px] sm:text-sm text-white leading-snug">Player Auction Center</h3>
                <p className="text-[11px] sm:text-[10px] text-white/90 leading-relaxed">
                  Track bids, budgets, and squad lists in real time.
                </p>
                <Link
                  to="/sports/auction"
                  className="block w-full text-center py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-[13px] sm:text-xs font-extrabold bg-white text-slate-900 hover:bg-slate-50 transition active:scale-95 shadow-xs flex items-center justify-center"
                >
                  Enter Auction Room →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════ PARTNER NOMINATION MODAL ════════════════════ */}
        {partnerModalState.open && partnerModalState.registration && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-3.5 sm:p-5 space-y-3 sm:space-y-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto safe-area-bottom">
              <div className="flex items-start justify-between gap-2 sm:gap-3 border-b border-slate-100 pb-2.5 sm:pb-3">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] sm:text-base font-extrabold text-slate-900 truncate">
                      {partnerModalState.registration.partnerUserId ? "Change Partner" : "Nominate Partner"}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                      {partnerModalState.registration.eventName}
                      {partnerModalState.registration.categoryName ? ` · ${partnerModalState.registration.categoryName}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPartnerModalState({ open: false, registration: null, selectedPartner: null, saving: false })}
                  className="p-2 sm:p-1.5 min-h-[40px] sm:min-h-0 min-w-[40px] sm:min-w-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              </div>

              <SportsPartnerSelector
                selectedPartner={partnerModalState.selectedPartner}
                onChange={(partner) => {
                  setPartnerModalState(prev => ({
                    ...prev,
                    selectedPartner: partner,
                  }));
                }}
                matchType={partnerModalState.registration.matchType || "DOUBLES"}
                currentGender={(user as any)?.gender}
                currentUserId={user?.userId || (user as any)?.id}
                communityId={user?.communityId}
                familyMembers={familyMembers}
                disabled={partnerModalState.saving}
              />

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPartnerModalState({ open: false, registration: null, selectedPartner: null, saving: false })}
                  disabled={partnerModalState.saving}
                  className="px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl border border-slate-200 text-[13px] sm:text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePartner}
                  disabled={partnerModalState.saving}
                  className="px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-[13px] sm:text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {partnerModalState.saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {partnerModalState.selectedPartner?.userId ? "Send Partner Invite" : "Save as Open Pool"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ CAPTAIN NOMINATION MODAL ════════════════════ */}
        {captainModalState.open && captainModalState.registration && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-3.5 sm:p-5 space-y-3 sm:space-y-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto safe-area-bottom">
              <div className="flex items-start justify-between gap-2 sm:gap-3 border-b border-slate-100 pb-2.5 sm:pb-3">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] sm:text-base font-extrabold text-slate-900">
                      Captain Nomination
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                      {captainModalState.registration.eventName}
                      {captainModalState.registration.categoryName ? ` · ${captainModalState.registration.categoryName}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCaptainModalState({ open: false, registration: null, nominated: false, teamName: "", saving: false })}
                  className="p-2 sm:p-1.5 min-h-[40px] sm:min-h-0 min-w-[40px] sm:min-w-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 sm:p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] sm:text-xs font-bold text-amber-950">Self-Nominate as Captain</p>
                      <p className="text-[11px] sm:text-[11px] text-amber-800 mt-0.5">
                        Lead a team and participate in the player draft.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCaptainModalState(prev => ({ ...prev, nominated: !prev.nominated }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        captainModalState.nominated ? "bg-amber-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          captainModalState.nominated ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {captainModalState.nominated && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <label className="block text-[13px] sm:text-xs font-bold text-slate-700">
                      Team Name <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Strikers, Blasters XI"
                      value={captainModalState.teamName}
                      onChange={(e) => setCaptainModalState(prev => ({ ...prev, teamName: e.target.value }))}
                      className="w-full px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 text-[13px] sm:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                    />
                  </div>
                )}

                <p className="text-[11px] sm:text-[11px] text-slate-500 leading-relaxed">
                  Organizers will review nominations and confirm appointments before the draft.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCaptainModalState({ open: false, registration: null, nominated: false, teamName: "", saving: false })}
                  disabled={captainModalState.saving}
                  className="px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl border border-slate-200 text-[13px] sm:text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCaptainNomination}
                  disabled={captainModalState.saving}
                  className="px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl bg-amber-600 hover:bg-amber-700 text-[13px] sm:text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {captainModalState.saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {captainModalState.nominated ? "Submit Nomination" : "Withdraw Nomination"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
