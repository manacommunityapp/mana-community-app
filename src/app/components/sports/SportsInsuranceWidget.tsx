import { useState } from "react";
import { Link } from "react-router";
import { ShieldCheck, ChevronRight, ExternalLink, Dumbbell, ShieldAlert, Users } from "lucide-react";
import { CATEGORIES } from "../../../constants/insurance";

const SPORTS_CATEGORIES = CATEGORIES.filter((c) => c.group === "SPORTS");

const SPORTS_PLANS = [
  {
    key: "SPORTS_PA" as const,
    title: "Player Personal Accident",
    tagline: "Injury cover for individual players",
    highlights: ["Fractures & ligament tears", "Physio & rehab costs", "Loss of income during recovery"],
    startingFrom: 299,
    icon: Dumbbell,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    key: "SPORTS_EVENT_LIABILITY" as const,
    title: "Event & Tournament Liability",
    tagline: "Third-party cover for organisers",
    highlights: ["Spectator injury liability", "Property damage during events", "Legal defence costs"],
    startingFrom: 1499,
    icon: ShieldAlert,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    key: "SPORTS_TEAM_GROUP" as const,
    title: "Team / Club Group Cover",
    tagline: "Group policy for all team members",
    highlights: ["Covers entire roster in one policy", "Tournament-specific add-ons", "Academy & coaching cover"],
    startingFrom: 199,
    icon: Users,
    gradient: "from-violet-500 to-purple-600",
  },
];

export function SportsInsuranceWidget() {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  return (
    <div className="p-3 sm:p-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">Sports Insurance</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Protect players, teams &amp; events</p>
        </div>
      </div>

      {/* Quick category pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {SPORTS_CATEGORIES.map((cat) => (
          <Link
            key={cat.key}
            to={`/insurance?tab=catalogue&category=${cat.key}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition shadow-sm"
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </Link>
        ))}
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SPORTS_PLANS.map((plan) => {
          const isExpanded = expandedPlan === plan.key;
          const Icon = plan.icon;
          return (
            <div
              key={plan.key}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Card header with gradient */}
              <div className={`bg-gradient-to-br ${plan.gradient} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-white/90" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Sports Cover</span>
                </div>
                <h3 className="text-sm font-black text-white leading-tight">{plan.title}</h3>
                <p className="text-[11px] text-white/80 mt-1">{plan.tagline}</p>
              </div>

              {/* Card body */}
              <div className="p-4">
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-[10px] text-slate-400">from</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">&#8377;{plan.startingFrom}</span>
                  <span className="text-[10px] text-slate-400">/person/year</span>
                </div>

                {/* Highlights */}
                <button
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.key)}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-2 cursor-pointer hover:underline"
                >
                  {isExpanded ? "Hide details" : "View highlights"}
                </button>

                {isExpanded && (
                  <ul className="space-y-1.5 mb-3">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <ShieldCheck className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA */}
                <Link
                  to={`/insurance?tab=catalogue&category=${plan.key}`}
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  <span>Browse Plans</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="mt-5 p-4 bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-800/50 dark:to-indigo-950/20 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-1">Why Sports Insurance?</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Sports injuries account for a significant share of accidental claims in India. Standard health policies
              often exclude sports-related injuries or have sub-limits. Dedicated sports cover bridges this gap —
              covering fractures, ligament tears, concussions, and rehabilitation costs specific to sporting activities.
            </p>
            <Link
              to="/insurance"
              className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Go to Insurance Portal <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
