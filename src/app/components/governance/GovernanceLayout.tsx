import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import {
  Landmark, Calendar, Vote, FileCheck, FolderLock, Users,
  CheckCircle2, AlertCircle, Plus, Shield, Search, Bell, Sparkles, TrendingUp
} from "lucide-react";

const GOVERNANCE_TABS = [
  { to: "dashboard",   icon: Landmark,    label: "Dashboard" },
  { to: "meetings",    icon: Calendar,    label: "AGM & EGM Meetings" },
  { to: "proposals",   icon: FileCheck,   label: "Community Proposals" },
  { to: "voting",      icon: Vote,        label: "Voting & Secret Ballots" },
  { to: "resolutions", icon: CheckCircle2,label: "Resolutions & Actions" },
  { to: "vault",       icon: FolderLock,  label: "Digital Records Vault" },
  { to: "committee",   icon: Users,       label: "Committee & Elections" },
];

export function GovernanceLayout() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-0 -m-4 sm:-m-6 lg:-m-8 min-h-[calc(100vh-4rem)] bg-background text-foreground">

      {/* ── Governance Header Band ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 sm:px-6 lg:px-8 py-7 text-white shadow-xl relative overflow-hidden border-b border-indigo-900/40">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          {/* Brand & Purpose */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Mana Governance</h1>
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black rounded-full">
                  Verified Democratic Operating System
                </span>
              </div>
              <p className="text-indigo-200 text-xs mt-1 font-medium max-w-xl">
                Transparent community meetings (AGM/EGM), proposals, secret voting, quorum calculation, resolutions, and digital vault.
              </p>
            </div>
          </div>

          {/* Quick Stats Widget */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-center">
              <div className="text-xs font-black text-amber-300">AGM 2026</div>
              <div className="text-[10px] text-indigo-200">25 Oct · 10:00 AM</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-center">
              <div className="text-xs font-black text-emerald-400">Quorum: 51.5%</div>
              <div className="text-[10px] text-indigo-200">438 / 425 Min</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-center">
              <div className="text-xs font-black text-cyan-300">1 Active Ballot</div>
              <div className="text-[10px] text-indigo-200">EV Fast-Charging</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E1E36] border-b border-slate-200 dark:border-slate-800 sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar -mb-px">
            {GOVERNANCE_TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={`/governance/${tab.to}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3.5 text-xs font-black border-b-2 whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:border-slate-300"
                  }`
                }
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page Content ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </div>
    </div>
  );
}
