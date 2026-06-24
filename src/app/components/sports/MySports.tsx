import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import "./SportsAuction.css";
import { sportsService } from "../../../services/sportsService";
import { auctionService } from "../../../services/auctionService";
import { communityService } from "../../../services/communityService";
import type { SportMeta, EventRegistration, AuctionTeam, CommunityResponse } from "../../../types/api";

const ALL_SPORTS = [
  { id: "cricket",     icon: "🏏", name: "Cricket" },
  { id: "badminton",   icon: "🏸", name: "Badminton" },
  { id: "football",    icon: "⚽", name: "Football" },
  { id: "tennis",      icon: "🎾", name: "Tennis" },
  { id: "volleyball",  icon: "🏐", name: "Volleyball" },
  { id: "tabletennis", icon: "🏓", name: "Table Tennis" },
  { id: "basketball",  icon: "🏀", name: "Basketball" },
  { id: "chess",       icon: "♟️", name: "Chess" },
];

const MATCH_TYPES: Record<string, string[]> = {
  cricket:     ["Singles / XI", "Doubles"],
  badminton:   ["Singles", "Doubles", "Mixed Doubles"],
  football:    ["Team (5-a-side)", "Team (11-a-side)"],
  tennis:      ["Singles", "Doubles", "Mixed Doubles"],
  volleyball:  ["Team", "Beach (2v2)"],
  tabletennis: ["Singles", "Doubles"],
  basketball:  ["3v3", "5v5"],
  chess:       ["Singles", "Blitz"],
};

const TABS = [
  { id: "tournaments", label: "My Tournaments", icon: Trophy },
  { id: "community",   label: "My Community",   icon: Building2 },
  { id: "teams",       label: "My Teams",       icon: Users },
  { id: "matches",     label: "My Matches",     icon: Calendar },
  { id: "settings",    label: "Sports Settings",icon: Settings },
] as const;

type TabId = typeof TABS[number]["id"];
type StatsTab = "basketball" | "soccer";

function getCategory(age: number, gender: string): string {
  if (age < 12) return "Kids (Under 12)";
  if (age < 18) return gender === "Female" ? "Girls (12-18)" : "Boys (12-18)";
  if (age > 55) return "Senior Citizens (55+)";
  return gender === "Female" ? "Womens (18-55)" : "Mens (18-55)";
}

const achievements = [
  { id: 1, title: "Season MVP", desc: "Basketball Q1 2026", icon: Star, color: "#f59e0b", unlocked: true },
  { id: 2, title: "Hat-trick Hero", desc: "3 goals in one game", icon: Target, color: "#10b981", unlocked: true },
  { id: 3, title: "Iron Man", desc: "15 games no absence", icon: Zap, color: "#6366f1", unlocked: true },
  { id: 4, title: "Champion", desc: "Win a league title", icon: Trophy, color: "#f59e0b", unlocked: false },
  { id: 5, title: "All-Rounder", desc: "Play 3 different sports", icon: Activity, color: "#8b5cf6", unlocked: false },
  { id: 6, title: "League Leader", desc: "Top scorer in league", icon: Award, color: "#ef4444", unlocked: false },
];

export function MySports() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (location.pathname.endsWith("/register")) {
      return "settings";
    }
    return "tournaments";
  });
  const [activeStatsTab, setActiveStatsTab] = useState<StatsTab>("basketball");

  useEffect(() => {
    if (location.pathname.endsWith("/register")) {
      setActiveTab("settings");
    } else if (location.pathname.endsWith("/my-sports")) {
      setActiveTab("tournaments");
    }
  }, [location.pathname]);

  // Registration form states
  const [apiSports, setApiSports] = useState<SportMeta[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({ cricket: true, badminton: true });
  const [matchTypes, setMatchTypes] = useState<Record<string, string>>({});
  const [age, setAge] = useState("28");
  const [gender, setGender] = useState("Male");
  const [submitting, setSubmitting] = useState(false);

  // Dashboard states
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [teams, setTeams] = useState<AuctionTeam[]>([]);
  const [myMatches, setMyMatches] = useState<any[]>([]);
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const displayName = user?.fullName ?? "Alex Johnson";
  const userInitials = user?.fullName 
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() 
    : "AJ";

  const fetchTabData = async () => {
    if (!user?.userId) return;
    setLoadingData(true);
    try {
      const [regs, myTeams, events, comms, sports] = await Promise.all([
        sportsService.getMyRegistrations().catch(() => []),
        auctionService.getCaptainRegistration().catch(() => []),
        sportsService.getMyEvents().catch(() => []),
        communityService.getCommunities().catch(() => []),
        sportsService.getSportsMeta().catch(() => [])
      ]);
      setRegistrations(regs || []);
      setTeams(myTeams || []);
      setMyMatches(events || []);
      setCommunities(comms || []);
      setApiSports(sports || []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoadingData(false);
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    fetchTabData();
  }, [user?.userId]);

  const toggleSport = (id: string) =>
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const setMatchType = (sportId: string, type: string) =>
    setMatchTypes(prev => ({ ...prev, [sportId]: type }));

  const selectedSports = ALL_SPORTS.filter(s => selected[s.id]);
  const autoCategory = getCategory(parseInt(age) || 18, gender);

  const handleWithdraw = async (regId: number) => {
    if (!confirm("Are you sure you want to withdraw from this event?")) return;
    try {
      await sportsService.withdraw(regId);
      toast.success("Withdrawn successfully!");
      fetchTabData();
    } catch (err) {
      toast.error("Failed to withdraw from event");
    }
  };

  const handleSubmit = async () => {
    if (selectedSports.length === 0) { toast.error("Select at least one sport"); return; }
    if (!user?.communityId) { toast.error("Community not found. Please log in again."); return; }

    setSubmitting(true);
    try {
      for (const sport of selectedSports) {
        const backendSport = apiSports.find(s => s.name.toLowerCase() === sport.name.toLowerCase());
        if (!backendSport) continue;
        await sportsService.createEvent({
          name: `${sport.name} — ${autoCategory}`,
          sportId: backendSport.id,
          communityId: user.communityId,
          eventDateStart: new Date().toISOString().split("T")[0],
          eventDateEnd: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          format: matchTypes[sport.id] ?? undefined,
        });
      }
      toast.success(`Registered for ${selectedSports.length} sport(s)!`);
      fetchTabData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const myCommunity = communities.find(c => c.id === user?.communityId);

  const stats: Record<StatsTab, { label: string; value: string; sub: string }[]> = {
    basketball: [
      { label: "Points/Game", value: "22.4", sub: "+3.1 vs last season" },
      { label: "Assists/Game", value: "6.8", sub: "+1.2 vs last season" },
      { label: "Rebounds/Game", value: "7.2", sub: "+0.8 vs last season" },
      { label: "Win Rate", value: "73%", sub: "8W – 3L" },
    ],
    soccer: [
      { label: "Goals", value: "8", sub: "+3 vs last season" },
      { label: "Assists", value: "5", sub: "Top 3 in team" },
      { label: "Matches", value: "10", sub: "All started" },
      { label: "Win Rate", value: "50%", sub: "5W – 5L" },
    ],
  };

  return (
    <div className="auction-hub-wrapper animate-fade-in-up stagger-1">
      <Toaster position="top-center" richColors />

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
                <span className="nav-text">{tab.label}</span>
                <div className="active-indicator" />
              </button>
            );
          })}
        </div>
      </aside>

      <main className="main-content">
        <div className="page active space-y-6">
          <div className="page-hdr">
            <div>
              <div className="page-title">{TABS.find(t => t.id === activeTab)?.label}</div>
              <div className="page-sub">Manage your active tournaments, matches, teams, and registrations</div>
            </div>
          </div>

          {/* Player Card */}
          <div className="rounded-2xl p-6 bg-white border border-[#6366f1]/12 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Avatar & Info */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-lg shadow-indigo-500/20"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {userInitials}
            </div>
            <div className="text-left">
              <h2 className="font-bold text-xl text-[#0d0d2b] flex items-center gap-2">
                {displayName}
              </h2>
              <p className="text-xs text-[#6b7094] mt-1">
                Member since Nov 2025 · <span className="font-semibold text-indigo-600">{myCommunity?.name ?? "Verified Community Resident"}</span>
              </p>
            </div>
          </div>

          {/* Center/Right: Stats & Action */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 justify-between md:justify-end flex-1">
            <div className="flex items-center gap-6 sm:gap-8">
              {[
                { label: "Teams", value: teams.length.toString() },
                { label: "Registrations", value: registrations.length.toString() },
                { label: "Matches", value: myMatches.length.toString() }
              ].map((s) => (
                <div key={s.label} className="text-left md:text-center">
                  <p className="font-extrabold text-lg text-[#0d0d2b]">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-[#6b7094]">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="shrink-0">
              <Link to="/profile" className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-indigo-500/10 active:scale-[0.98]"
                style={{ background: "rgba(99,102,241,0.08)", color: "#4f46e5", border: "1px solid rgba(99,102,241,0.2)" }}>
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Active Tab Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Active Tab Panel Content */}
          <div className="flex-1 min-w-0">
            {loadingData ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl bg-white border border-[rgba(99,102,241,0.1)] shadow-sm">
                <Loader2 className="w-8 h-8 text-[#4f46e5] animate-spin" />
                <p className="text-xs text-[#6b7094]">Fetching your sports configurations...</p>
              </div>
            ) : (
              <>
                {/* ════════════ MY TOURNAMENTS TAB ════════════ */}
                {activeTab === "tournaments" && (
                  <div className="space-y-4 text-left">
                    {registrations.length === 0 ? (
                      <div className="text-center py-16 rounded-xl shadow-lg bg-white"
                        style={{ border: "1px solid rgba(99, 102, 241, 0.12)", boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px" }}>
                        <Trophy className="w-12 h-12 text-[#94a3b8] mx-auto mb-4" />
                        <p className="font-medium text-slate-800">You haven't registered for any tournaments yet.</p>
                        <p className="text-xs mt-1 mb-6 text-[#6b7094]">Explore the baseline categories and register in the "Sports Settings" tab.</p>
                        <button
                          onClick={() => setActiveTab("settings")}
                          className="px-4 py-2.5 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-[0.97] cursor-pointer border-none"
                          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
                        >
                          Register Now
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {registrations.map(reg => {
                          const statusColors: Record<string, string> = {
                            PENDING: "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20",
                            REGISTERED: "bg-orange-500/10 text-orange-600 border border-orange-500/20",
                            CONFIRMED: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                            WITHDRAWN: "bg-red-500/10 text-red-600 border border-red-500/20",
                          };

                          return (
                            <div key={reg.id} className="p-5 bg-white rounded-xl flex flex-col justify-between gap-4 relative hover:border-indigo-500/30 transition-all duration-300"
                              style={{ border: "1px solid rgba(99, 102, 241, 0.12)", boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px" }}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-xs uppercase tracking-wider font-semibold text-indigo-600">{reg.event?.sport?.name || "Sport Event"}</div>
                                  <h4 className="text-sm font-bold truncate mt-1 leading-snug text-slate-800">{reg.event?.name}</h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {reg.category?.name && (
                                      <span className="text-[10px] bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
                                        {reg.category.name}
                                      </span>
                                    )}
                                    {reg.age && (
                                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                                        Age: {reg.age}
                                      </span>
                                    )}
                                    {reg.flatNumber && (
                                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                                        Flat: {reg.flatNumber}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wide flex-shrink-0 ${statusColors[reg.status] || "bg-slate-100 text-slate-600"}`}>
                                  {reg.status}
                                </span>
                              </div>

                              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-1">
                                <div className="flex items-center gap-1.5 text-xs text-[#6b7094] font-medium">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Registered on {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"}</span>
                                </div>
                                {["PENDING", "REGISTERED"].includes(reg.status) && (
                                  <button
                                    onClick={() => handleWithdraw(reg.id)}
                                    className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-red-500 rounded-lg transition-all cursor-pointer bg-transparent"
                                    title="Withdraw"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ════════════ MY COMMUNITY TAB ════════════ */}
                {activeTab === "community" && (
                  <div className="space-y-4">
                    {!myCommunity ? (
                      <div className="text-center py-12 bg-white rounded-xl p-6 shadow-lg"
                        style={{ border: "1px solid rgba(99, 102, 241, 0.12)" }}>
                        <Building2 className="w-12 h-12 text-[#94a3b8] mx-auto mb-4" />
                        <p className="font-medium text-slate-800">No community settings found.</p>
                        <p className="text-xs mt-1 text-[#6b7094]">Make sure you have selected or joined a community in your profile dashboard.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl p-6 shadow-xl relative hover:border-indigo-500/20 transition-all duration-300"
                        style={{ border: "1px solid rgba(99, 102, 241, 0.12)" }}>
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-5">
                          <div className="p-3.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-500">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-base font-bold uppercase tracking-wider text-slate-800">{myCommunity.name}</h3>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest mt-1 inline-block">
                              {myCommunity.type} COMMUNITY
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-left">
                          <div className="space-y-1">
                            <span className="text-[#6b7094] uppercase tracking-wider block font-medium">Community Code</span>
                            <p className="text-sm font-bold text-indigo-600">{myCommunity.code || "—"}</p>
                          </div>
                          {myCommunity.inviteCode && (
                            <div className="space-y-1">
                              <span className="text-[#6b7094] uppercase tracking-wider block font-medium">Invite Registration Code</span>
                              <p className="text-sm font-bold text-emerald-600 select-all">{myCommunity.inviteCode}</p>
                            </div>
                          )}
                          <div className="space-y-1">
                            <span className="text-[#6b7094] uppercase tracking-wider block font-medium">Sub-Type / Classification</span>
                            <p className="text-sm font-bold text-slate-800 capitalize">{myCommunity.subtype || "Standard Community"}</p>
                          </div>
                          <div className="space-y-1 font-medium text-[#6b7094]">
                            <span className="text-[#6b7094] uppercase tracking-wider block">Location Details</span>
                            <p className="text-sm font-bold text-slate-800">
                              {myCommunity.area ? `${myCommunity.area}, ` : ""}{myCommunity.city || "Bangalore"}{myCommunity.state ? `, ${myCommunity.state}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ════════════ MY TEAMS TAB ════════════ */}
                {activeTab === "teams" && (
                  <div className="space-y-4 text-left">
                    {teams.length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-xl p-6 shadow-lg"
                        style={{ border: "1px solid rgba(99, 102, 241, 0.12)" }}>
                        <Users className="w-12 h-12 text-[#94a3b8] mx-auto mb-4" />
                        <p className="font-medium text-slate-800">No auction/tournament teams found.</p>
                        <p className="text-xs mt-1 text-[#6b7094]">Teams will appear here once you are assigned to an auction team or nominated as a captain.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teams.map(team => {
                          const total = team.totalBudget || 1000;
                          const spent = team.spent || 0;
                          const remaining = team.remainingBudget || (total - spent);
                          const percent = Math.min(100, Math.round((spent / total) * 100));

                          return (
                            <div key={team.id} className="p-5 bg-white rounded-xl flex flex-col gap-4 hover:border-indigo-500/30 transition-all duration-300 animate-fade-in-up"
                              style={{ border: "1px solid rgba(99, 102, 241, 0.12)", boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px" }}>
                              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                    {team.emoji || "🛡️"} {team.teamName}
                                  </h4>
                                  <span className="text-[10px] text-[#6b7094] mt-0.5 block font-semibold">Owner: {team.ownerName || "—"}</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${team.captainConfirmation ? "bg-emerald-500/15 text-emerald-600" : "bg-indigo-500/15 text-indigo-600"}`}>
                                  {team.captainConfirmation ? "CONFIRMED CAPTAIN" : "NOMINATED"}
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-[#6b7094] font-medium">
                                  <span>Budget Spent: ₹{spent.toLocaleString()}</span>
                                  <span>Total: ₹{total.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 border border-slate-200">
                                  <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                                </div>
                                <div className="text-[10px] text-emerald-600 font-semibold text-right">Remaining: ₹{remaining.toLocaleString()}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ════════════ MY MATCHES TAB ════════════ */}
                {activeTab === "matches" && (
                  <div className="space-y-4">
                    {myMatches.length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-xl p-6 shadow-lg"
                        style={{ border: "1px solid rgba(99, 102, 241, 0.12)" }}>
                        <Calendar className="w-12 h-12 text-[#94a3b8] mx-auto mb-4" />
                        <p className="font-medium text-slate-800">No upcoming scheduled matches found.</p>
                        <p className="text-xs mt-1 text-[#6b7094]">Once brackets are seeded and matches are scheduled, they will appear in your timeline.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl p-5 shadow-lg"
                        style={{ border: "1px solid rgba(99, 102, 241, 0.12)" }}>
                        <div className="text-xs font-semibold text-[#6b7094] uppercase tracking-widest mb-5 border-b border-slate-100 pb-2 text-left">My Match Timeline</div>
                        <div className="space-y-1">
                          {myMatches.map((m, i) => {
                            const statusColors: Record<string, string> = {
                              LIVE: "#10b981",
                              REGISTRATION_OPEN: "#10b981",
                              REGISTRATION_CLOSED: "#ea580c",
                              COMPLETED: "#818cf8",
                            };
                            const color = statusColors[m.registrationStatus] || "#64748b";

                            return (
                              <div key={m.id} className="relative flex gap-4 pb-6">
                                <div className="flex flex-col items-center">
                                  <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1 border border-white" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                                  {i < myMatches.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1.5" />}
                                </div>
                                <div className="flex-1 min-w-0 pb-1 text-left animate-fade-in-up">
                                  <div className="text-xs text-[#6b7094] font-semibold">{m.eventDateStart ? new Date(m.eventDateStart).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "Date TBD"}</div>
                                  <h4 className="text-sm font-bold text-slate-800 mt-1">{m.sport?.name} — {m.name}</h4>
                                  <div className="text-xs text-[#6b7094] mt-1 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {m.venue?.name || "Venue TBD"}{m.venue?.city ? `, ${m.venue.city}` : ""}
                                  </div>
                                  <div className="flex gap-2 mt-2.5">
                                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">{m.format || "SINGLES"}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">{m.registrationStatus}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ════════════ SPORTS SETTINGS (REGISTRATION) TAB ════════════ */}
                {activeTab === "settings" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-left">
                    <div className="space-y-4">
                      {/* Sport selection */}
                      <div className="bg-white rounded-xl p-4 shadow-lg"
                        style={{ border: "1px solid rgba(99, 102, 241, 0.12)" }}>
                        <div className="text-xs font-semibold text-[#6b7094] uppercase tracking-widest mb-3">Select Sports</div>
                        {loadingMeta ? (
                          <div className="flex items-center gap-2 text-[#6b7094] text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {ALL_SPORTS.map(s => (
                              <button
                                key={s.id}
                                onClick={() => toggleSport(s.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                                  selected[s.id]
                                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-600"
                                    : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                                }`}
                              >
                                {s.icon} {s.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Player profile */}
                      <div className="bg-white rounded-xl p-4 shadow-lg"
                        style={{ border: "1px solid rgba(99, 102, 241, 0.12)" }}>
                        <div className="text-xs font-semibold text-[#6b7094] uppercase tracking-widest mb-3">Player Profile</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-[#6b7094] block mb-1.5">Full Name</label>
                            <input defaultValue={user?.fullName ?? "Community Player"} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs text-[#6b7094] block mb-1.5">Age</label>
                            <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs text-[#6b7094] block mb-1.5">Gender</label>
                            <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800">
                              <option>Male</option><option>Female</option><option>Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-[#6b7094] block mb-1.5">Govt ID</label>
                            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs text-emerald-600 font-semibold">Aadhaar Linked</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Auto category */}
                      <div className="bg-white rounded-xl p-4 shadow-lg"
                        style={{ border: "1px solid rgba(99, 102, 241, 0.12)" }}>
                        <div className="text-xs font-semibold text-[#6b7094] uppercase tracking-widest mb-3">Auto-assigned Category</div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 text-xs font-semibold">{autoCategory}</span>
                          <span className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 text-xs font-semibold">Open</span>
                        </div>
                        <p className="text-xs text-indigo-600 bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-2.5 leading-relaxed">
                          ℹ️ Category assigned by age and gender — Senior Citizens 55+, Kids Under 12, Boys/Girls 12–18, Mens/Womens 18–55.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Match type per sport */}
                      <div className="bg-white rounded-xl p-4 shadow-lg"
                        style={{ border: "1px solid rgba(99, 102, 241, 0.12)" }}>
                        <div className="text-xs font-semibold text-[#6b7094] uppercase tracking-widest mb-3">Match Type per Sport</div>
                        {selectedSports.length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-4">Select sports from the left panel</p>
                        ) : (
                          selectedSports.map(sport => (
                            <div key={sport.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-sm font-semibold text-slate-800">{sport.icon} {sport.name}</div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 font-medium">Age OK</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(MATCH_TYPES[sport.id] ?? ["Singles"]).map(type => (
                                  <button
                                    key={type}
                                    onClick={() => setMatchType(sport.id, type)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                                      matchTypes[sport.id] === type || (!matchTypes[sport.id] && type === (MATCH_TYPES[sport.id]?.[0]))
                                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-600"
                                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                    }`}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Age check */}
                      <div className="bg-white rounded-xl p-4 shadow-lg"
                        style={{ border: "1px solid rgba(99, 102, 241, 0.12)" }}>
                        <div className="text-xs font-semibold text-[#6b7094] uppercase tracking-widest mb-3">Age Restriction Check</div>
                        <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                          <div className="flex justify-between px-3 py-2 border-b border-slate-200 text-xs text-[#6b7094] font-semibold">
                            <span>Sport</span><span>Age Range</span><span>Status</span>
                          </div>
                          {[["🏏 Cricket", "10-60"], ["🏸 Badminton", "All ages"], ["⚽ Football", "10-50"]].map(([s, r]) => (
                            <div key={s} className="flex justify-between px-3 py-2 border-b border-slate-200 last:border-0 text-xs">
                              <span className="text-slate-800 font-medium">{s}</span>
                              <span className="text-[#6b7094]">{r}</span>
                              <span className="text-emerald-600 font-semibold">✓ Eligible</span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="w-full mt-4 py-3 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2 active:scale-[0.97]"
                          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
                        >
                          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : "Submit Registration ↗"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Performance Stats & Static Achievements/Progress */}
        <div className="space-y-5">
          {/* My Performance */}
          <div className="rounded-2xl p-5"
            style={{ background: "white", border: "1px solid rgba(99,102,241,0.12)", boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: "#0d0d2b" }}>My Performance</h3>
              <div className="flex rounded-xl p-1" style={{ background: "rgba(99,102,241,0.06)" }}>
                {(["basketball", "soccer"] as StatsTab[]).map((tab) => (
                  <button key={tab} onClick={() => setActiveStatsTab(tab)}
                    className="px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer"
                    style={activeStatsTab === tab
                      ? { background: "white", color: "#4f46e5", boxShadow: "0 1px 4px rgba(99,102,241,0.15)" }
                      : { color: "#6b7094" }}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {stats[activeStatsTab].map((stat) => (
                <div key={stat.label} className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.08)" }}>
                  <p className="text-2xl font-bold" style={{ color: "#4f46e5" }}>{stat.value}</p>
                  <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#0d0d2b" }}>{stat.label}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: "#10b981" }}>{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="rounded-2xl p-5"
            style={{ background: "white", border: "1px solid rgba(99,102,241,0.12)", boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: "#0d0d2b" }}>Achievements</h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(99,102,241,0.1)", color: "#4f46e5" }}>3/6</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((a) => (
                <div key={a.id} className="rounded-xl p-3 text-center flex flex-col justify-between"
                  style={{
                    background: a.unlocked ? `${a.color}10` : "rgba(107,112,148,0.03)",
                    border: `1px solid ${a.unlocked ? a.color + "25" : "rgba(107,112,148,0.08)"}`,
                    opacity: a.unlocked ? 1 : 0.6,
                  }}>
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: a.unlocked ? `${a.color}20` : "rgba(107,112,148,0.08)" }}>
                    <a.icon className="h-4 w-4" style={{ color: a.unlocked ? a.color : "#9ca3af" }} />
                  </div>
                  <p className="text-xs font-semibold" style={{ color: a.unlocked ? "#0d0d2b" : "#9ca3af" }}>{a.title}</p>
                  <p className="text-[9px] mt-0.5 leading-tight" style={{ color: "#9ca3af" }}>{a.desc}</p>
                  {a.unlocked && <CheckCircle className="h-3.5 w-3.5 mx-auto mt-1.5" style={{ color: a.color }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-2xl p-5"
            style={{ background: "white", border: "1px solid rgba(99,102,241,0.12)", boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px" }}>
            <h3 className="font-semibold mb-4" style={{ color: "#0d0d2b" }}>Season Progress</h3>
            <div className="space-y-3">
              {[
                { label: "Basketball", value: 73, color: "#f59e0b" },
                { label: "Soccer", value: 50, color: "#10b981" },
                { label: "Attendance", value: 88, color: "#6366f1" },
              ].map((p) => (
                <div key={p.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: "#6b7094" }}>{p.label}</span>
                    <span style={{ color: p.color }} className="font-semibold">{p.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(99,102,241,0.08)" }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${p.value}%`, background: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auction CTA */}
          <div className="rounded-2xl p-5 animate-pulse"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", boxShadow: "0 4px 20px rgba(245,158,11,0.2)" }}>
            <TrendingUp className="h-6 w-6 text-white opacity-85 mb-2" />
            <h3 className="font-semibold text-white">Player Auction</h3>
            <p className="text-xs text-white/80 mt-1 mb-3">Check active bids, player rankings, and budget usage.</p>
            <Link to="/sports/auction" className="block w-full text-center py-2 rounded-xl text-xs font-semibold bg-white text-[#f59e0b] hover:bg-slate-50 transition-all active:scale-[0.97]">
              View Auction
            </Link>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
  );
}
