import { useState } from "react";
import {
  Calendar, Vote, FileCheck, CheckCircle2,
  Clock, ArrowRight, Sparkles, AlertTriangle, Users,
  FolderLock, TrendingUp, ShieldCheck, Zap
} from "lucide-react";
import { Link } from "react-router";

export function GovernanceDashboard() {
  const [stats] = useState({
    upcomingMeetings: 1,
    activeProposals: 3,
    openVotes: 1,
    passedResolutions: 14,
    actionItemsOpen: 4,
    myMeetingsAttended: 4,
    myVotesRecorded: 9,
  });

  return (
    <div className="space-y-6">
      {/* ── Metric Cards Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: Calendar,    label: "Upcoming Meetings", value: "1 (AGM)",      sub: "25 Oct · Hybrid",        color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400" },
          { icon: Vote,        label: "Active Voting",     value: "1 Open",       sub: "EV Fast Chargers",       color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400" },
          { icon: FileCheck,   label: "Open Proposals",    value: "3 Active",     sub: "Solar Grid & Gym",       color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400" },
          { icon: CheckCircle2,label: "Action Items",      value: "4 Pending",    sub: "1 Overdue · Track SLA",  color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 hover:shadow-md transition-all">
            <div className={`p-3 rounded-2xl ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900 dark:text-white leading-none">{s.value}</div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">{s.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Two Column Grid: Upcoming AGM & Active Secret Ballot ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AGM Spotlight Banner & Recent Proposals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spotlight Card */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <span className="px-3 py-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full inline-flex items-center gap-1 shadow-sm">
                  📢 Official Community Notice
                </span>
                <h2 className="text-xl font-black text-white leading-tight">
                  Annual General Body Meeting (AGM) 2026
                </h2>
                <p className="text-xs text-indigo-200 leading-relaxed max-w-xl">
                  Review annual audited financials (₹1.8 Cr maintenance fund), approve the 2026-28 Management Committee elections, and vote on Basement EV Charging Stations.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-indigo-150 pt-1">
                  <span>📅 Sunday, 25 October 2026</span>
                  <span>⏰ 10:00 AM IST</span>
                  <span>📍 Clubhouse & Google Meet</span>
                </div>
              </div>
            </div>

            {/* Quorum Progress Bar */}
            <div className="mt-5 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Quorum Status: Achieved (51.5%)
                </span>
                <span className="text-white">438 Confirmed / 425 Min Required</span>
              </div>
              <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full" style={{ width: "51.5%" }} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-5">
              <Link
                to="/governance/meetings"
                className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs font-black transition-all shadow-md inline-flex items-center gap-1.5"
              >
                View 10-Point Agenda & RSVP <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/governance/vault"
                className="px-4 py-2.5 bg-white/15 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 inline-flex items-center gap-1.5"
              >
                <FolderLock className="w-4 h-4" /> Download Annual Report PDF
              </Link>
            </div>
          </div>

          {/* Active Proposals Pipeline */}
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Community Proposals Pipeline</h3>
                <p className="text-xs text-slate-500">Proposals under review for next committee & AGM agenda.</p>
              </div>
              <Link to="/governance/proposals" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                View All Proposals →
              </Link>
            </div>

            <div className="space-y-3">
              {[
                { title: "Install 12 Dedicated EV Fast-Charging Points in Basement Parking", category: "INFRASTRUCTURE", cost: "₹8,50,000", status: "APPROVED FOR AGM", votes: 142 },
                { title: "Complete Solar Rooftop Photovoltaic Grid (100 kWp)", category: "ENVIRONMENT", cost: "₹14,00,000", status: "UNDER REVIEW", votes: 89 },
                { title: "Clubhouse Gym Equipment Upgrade & Acoustic Flooring", category: "AMENITIES", cost: "₹3,20,000", status: "SUBMITTED", votes: 54 },
              ].map((p) => (
                <div key={p.title} className="p-4 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[9px] font-black rounded">
                        {p.category}
                      </span>
                      <span className="text-[10px] text-slate-500">Est. Cost: <strong className="text-slate-800 dark:text-slate-200">{p.cost}</strong></span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{p.title}</h4>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-850">
                      {p.status}
                    </span>
                    <span className="text-xs font-bold text-slate-500">👍 {p.votes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Open Voting & My Participation Tracker */}
        <div className="space-y-6">
          {/* Active Ballot Card */}
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-black rounded-full flex items-center gap-1">
                <Vote className="w-3 h-3" /> Secret Ballot Open
              </span>
              <span className="text-[10px] text-slate-400">Closes in 3 days</span>
            </div>

            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
              Resolution: EV Fast-Charging Grid Sanction & Vendor SLA
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              One eligible vote per registered flat unit. Ballots are cryptographically decoupled from voter identity for total secrecy.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Total Ballots Cast:</span>
                <strong className="text-slate-900 dark:text-white">542 / 850 (63.7%)</strong>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Quorum Status:</span>
                <strong className="text-emerald-600">✓ Validated</strong>
              </div>
            </div>

            <Link
              to="/governance/voting"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Vote className="w-4 h-4" /> Cast Secret Ballot
            </Link>
          </div>

          {/* My Governance Participation Card */}
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                My Community Participation
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl text-center border border-indigo-100 dark:border-indigo-900">
                <div className="text-lg font-black text-indigo-700 dark:text-indigo-400">4 / 4</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Meetings Attended</div>
              </div>
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl text-center border border-purple-100 dark:border-purple-900">
                <div className="text-lg font-black text-purple-700 dark:text-purple-400">9 / 9</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Votes Recorded</div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-850 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
                100% Democratic Engagement Score — Gold Community Citizen Badge
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
