import { useState } from "react";
import { Trophy, Users, MapPin, ClipboardList, ShieldCheck, CalendarCheck, XCircle } from "lucide-react";

interface PendingReg {
  id: number;
  teamName: string;
  sport: string;
  captain: string;
  email: string;
  members: number;
  date: string;
}

interface Team {
  id: number;
  name: string;
  sport: string;
  division: string;
  captain: string;
  members: number;
  status: string;
  record: string;
}

interface DashboardTabProps {
  activeTournaments: any[];
  teamsList: Team[];
  pendingList: PendingReg[];
  venues: any[];
  activeEvents: any[];
  approveTeam: (id: number) => void;
  rejectTeam?: (id: number) => void;
  setActiveTab: (tab: any) => void;
}

export function DashboardTab({
  activeTournaments,
  teamsList,
  pendingList,
  venues,
  activeEvents,
  approveTeam,
  rejectTeam,
  setActiveTab,
}: DashboardTabProps) {
  const [showAllPending, setShowAllPending] = useState(false);
  const [showAllTournaments, setShowAllTournaments] = useState(false);
  const visiblePending = showAllPending ? pendingList : pendingList.slice(0, 5);
  const visibleTournaments = showAllTournaments ? activeTournaments : activeTournaments.slice(0, 6);
  return (
    <div className="space-y-6 animate-fade-in-up text-left">
      {/* Hero Welcome Banner */}
      <div
        className="rounded-3xl py-4 px-6 text-white relative overflow-hidden shadow-lg border border-indigo-500/10"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
        }}
      >
        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
          <ShieldCheck className="w-28 h-28 rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight flex flex-wrap items-baseline gap-2">
              <span>Overview</span>
              <span className="text-xs md:text-sm font-normal text-indigo-200">
                Manage community sports events and rules
              </span>
            </h2>
          </div>
          
          <div className="text-left md:text-right space-y-1 max-w-md">
            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase bg-indigo-500/30 border border-indigo-400/20 text-indigo-200 inline-block mb-0.5">
              Control Panel
            </span>
            <h3 className="text-sm md:text-base font-extrabold tracking-tight">Admin Command Center</h3>
            <p className="text-[10px] md:text-[11px] text-indigo-200 leading-relaxed">
              Configure sports rules, approve pending teams, manage tournament categories, and overview active registrations.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Tournaments</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{activeTournaments.length}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">Events</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Events</span>
            <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{activeEvents.filter(e => e.active !== false).length}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-violet-50 text-violet-600 font-medium">Scheduled</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Teams</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{teamsList.length}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">Approved</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approval</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{pendingList.length}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold animate-pulse">Pending</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Venues</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{venues.length}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">Locations</span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tournaments Quick List & Pending Approvals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Approvals Widget */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                Pending Registrations
              </h3>
              <button onClick={() => setActiveTab("teams")} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">
                Manage →
              </button>
            </div>

            <div className="space-y-3">
              {pendingList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  All team registrations have been processed.
                </div>
              ) : (
                <>
                  {visiblePending.map((reg) => (
                    <div key={reg.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-slate-800">{reg.teamName}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Captain: {reg.captain} · Email: {reg.email}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {rejectTeam && (
                          <button
                            onClick={() => rejectTeam(reg.id)}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => approveTeam(reg.id)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingList.length > 5 && (
                    <button
                      onClick={() => setShowAllPending(!showAllPending)}
                      className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 py-2 transition"
                    >
                      {showAllPending ? "Show less" : `Show all ${pendingList.length} pending`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
              Quick Navigation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveTab("sports-event")}
                className="p-4 bg-slate-50 hover:bg-indigo-50/30 rounded-xl border border-slate-100 hover:border-indigo-100 transition cursor-pointer text-left space-y-2 group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Event Rules</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Configure rule descriptions, caps, and options.</p>
              </div>

              <div
                onClick={() => setActiveTab("create-venue")}
                className="p-4 bg-slate-50 hover:bg-indigo-50/30 rounded-xl border border-slate-100 hover:border-indigo-100 transition cursor-pointer text-left space-y-2 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                  <MapPin className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Manage Venues</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Define court locations and booking settings.</p>
              </div>

              <div
                onClick={() => setActiveTab("player-category")}
                className="p-4 bg-slate-50 hover:bg-indigo-50/30 rounded-xl border border-slate-100 hover:border-indigo-100 transition cursor-pointer text-left space-y-2 group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-200">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Player Categories</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Set tier limits and register grading boundaries.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Tournaments / Sports List */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
              Active Tournaments
            </h3>
            <div className="space-y-3.5">
              {activeTournaments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No tournaments created yet.
                </div>
              ) : (
                <>
                  {visibleTournaments.map((t) => {
                    const isLive = t.registrationStatus === "LIVE";
                    const isDone = t.registrationStatus === "COMPLETED";
                    return (
                      <div key={t.id} className="text-left space-y-1 pb-3.5 border-b border-slate-100 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800">{t.name}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isLive ? "bg-red-50 text-red-600 border border-red-100" :
                            isDone ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                            "bg-slate-50 text-slate-400 border border-slate-100"
                          }`}>
                            {t.registrationStatus || "DRAFT"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Sport: {t.sport?.name || "General"} · Max Teams: {t.maxTeams || "N/A"}
                        </p>
                      </div>
                    );
                  })}
                  {activeTournaments.length > 6 && (
                    <button
                      onClick={() => setShowAllTournaments(!showAllTournaments)}
                      className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 py-2 transition"
                    >
                      {showAllTournaments ? "Show less" : `View all ${activeTournaments.length} tournaments`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quick Hint</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              To schedule matches or update match results live, open the dedicated **Sports Schedule** page from the sidebar menu. Settings and sports rules are configurable in this dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
