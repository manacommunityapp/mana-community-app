import { useState } from "react";
import { Link } from "react-router";
import {
  ShieldCheck, ChevronRight, ExternalLink, Dumbbell, ShieldAlert, Users,
  Calendar, Zap, Clock, CheckCircle,
} from "lucide-react";
import { CATEGORIES } from "../../../constants/insurance";

const SPORTS_CATEGORIES = CATEGORIES.filter((c) => c.group === "SPORTS");

type Duration = "per_game" | "monthly" | "annual";

interface PriceTier {
  price: number;
  unit: string;
  label: string;
  saving?: string;
}

interface SportsPlan {
  key: string;
  title: string;
  tagline: string;
  highlights: string[];
  pricing: Record<Duration, PriceTier | null>;
  icon: typeof Dumbbell;
  gradient: string;
  accentColor: string;
  perGameNote?: string;
}

const SPORTS_PLANS: SportsPlan[] = [
  {
    key: "SPORTS_PA",
    title: "Player Personal Accident",
    tagline: "Injury cover for individual players",
    highlights: [
      "Fractures & ligament tears",
      "Physio & rehab costs",
      "Loss of income during recovery",
      "Ambulance & emergency transport",
    ],
    pricing: {
      per_game: { price: 49,  unit: "/game",          label: "Per Game",   },
      monthly:  { price: 149, unit: "/month",         label: "Monthly",    saving: "Save ₹140 vs daily" },
      annual:   { price: 299, unit: "/player/year",   label: "Annual",     saving: "Best value" },
    },
    icon: Dumbbell,
    gradient: "from-emerald-500 to-teal-600",
    accentColor: "text-emerald-600 dark:text-emerald-400",
    perGameNote: "Activate before your match, valid 24h",
  },
  {
    key: "SPORTS_EVENT_LIABILITY",
    title: "Event & Tournament Liability",
    tagline: "Third-party cover for organisers",
    highlights: [
      "Spectator injury liability",
      "Property damage during events",
      "Legal defence costs",
      "Covers up to ₹25L per event",
    ],
    pricing: {
      per_game: { price: 999,  unit: "/single-day event", label: "Per Event (1 day)" },
      monthly:  null,
      annual:   { price: 4999, unit: "/year",              label: "Annual",  saving: "Up to 10 events" },
    },
    icon: ShieldAlert,
    gradient: "from-blue-500 to-indigo-600",
    accentColor: "text-blue-600 dark:text-blue-400",
    perGameNote: "Multi-day events: ₹1,499 (up to 3 days)",
  },
  {
    key: "SPORTS_TEAM_GROUP",
    title: "Team / Club Group Cover",
    tagline: "Group policy for all team members",
    highlights: [
      "Covers entire roster in one policy",
      "Tournament-specific add-ons",
      "Academy & coaching cover",
      "No individual declarations needed",
    ],
    pricing: {
      per_game: { price: 299, unit: "/team/match",  label: "Per Match" },
      monthly:  { price: 899, unit: "/team/month",  label: "Monthly",  saving: "Up to 15 players" },
      annual:   { price: 199, unit: "/player/year", label: "Annual",   saving: "Best value for clubs" },
    },
    icon: Users,
    gradient: "from-violet-500 to-purple-600",
    accentColor: "text-violet-600 dark:text-violet-400",
  },
];

const DURATION_META: Record<Duration, { label: string; icon: typeof Zap; short: string }> = {
  per_game: { label: "Per Game", icon: Zap,      short: "Game"    },
  monthly:  { label: "Monthly",  icon: Clock,    short: "Monthly" },
  annual:   { label: "Annual",   icon: Calendar, short: "Annual"  },
};

function PlanCard({ plan }: { plan: SportsPlan }) {
  const [duration, setDuration] = useState<Duration>("per_game");
  const [expanded, setExpanded] = useState(false);
  const Icon = plan.icon;
  const activeTier = plan.pricing[duration];

  const availableDurations = (Object.keys(plan.pricing) as Duration[]).filter(d => plan.pricing[d] !== null);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${plan.gradient} p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 text-white/90" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Sports Cover</span>
        </div>
        <h3 className="text-sm font-black text-white leading-tight">{plan.title}</h3>
        <p className="text-[11px] text-white/80 mt-1">{plan.tagline}</p>
      </div>

      {/* Duration picker */}
      <div className="px-4 pt-3 pb-0">
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5">
          {availableDurations.map((d) => {
            const meta = DURATION_META[d];
            const DIcon = meta.icon;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  duration === d
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <DIcon className="w-3 h-3" />
                {meta.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pricing */}
      <div className="px-4 py-3 flex-1">
        {activeTier ? (
          <div className="mb-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-slate-400">from</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                &#8377;{activeTier.price.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-slate-400">{activeTier.unit}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {activeTier.saving && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  {activeTier.saving}
                </span>
              )}
              {duration === "per_game" && plan.perGameNote && (
                <span className="text-[9px] text-slate-400">{plan.perGameNote}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-3 py-3 text-center text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl">
            Not available as monthly — choose Per Event or Annual
          </div>
        )}

        {/* Highlights toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`text-[10px] font-bold mb-2 cursor-pointer hover:underline ${plan.accentColor}`}
        >
          {expanded ? "Hide details" : "View coverage"}
        </button>

        {expanded && (
          <ul className="space-y-1.5 mb-3">
            {plan.highlights.map((h) => (
              <li key={h} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <Link
          to={`/insurance?tab=catalogue&category=${plan.key}&duration=${duration}`}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          {activeTier ? (
            <>Get {DURATION_META[duration].label} Cover <ExternalLink className="w-3 h-3" /></>
          ) : (
            <>Browse Plans <ExternalLink className="w-3 h-3" /></>
          )}
        </Link>
      </div>
    </div>
  );
}

export function SportsInsuranceWidget() {
  return (
    <div className="p-3 sm:p-5 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">Sports Insurance</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Per game, monthly or annual — your choice</p>
        </div>
      </div>

      {/* Duration explainer strip */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { icon: Zap,      label: "Per Game",    desc: "Activate before a match, lapse after",  color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/30"   },
          { icon: Clock,    label: "Monthly",     desc: "Rolling cover all month, auto-renews",   color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/30"     },
          { icon: Calendar, label: "Annual",      desc: "Best value, 365-day uninterrupted cover",color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
        ] as const).map(t => (
          <div key={t.label} className={`${t.bg} rounded-xl p-3 text-center`}>
            <t.icon className={`w-4 h-4 ${t.color} mx-auto mb-1`} />
            <p className={`text-[11px] font-extrabold ${t.color}`}>{t.label}</p>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick category pills */}
      {SPORTS_CATEGORIES.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
      )}

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SPORTS_PLANS.map((plan) => <PlanCard key={plan.key} plan={plan} />)}
      </div>

      {/* Comparison table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Quick Comparison</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-4 py-2 font-bold text-slate-500 dark:text-slate-400 w-32">Plan</th>
                <th className="px-3 py-2 font-bold text-amber-600 dark:text-amber-400 text-center">
                  <Zap className="w-3 h-3 inline mr-0.5" />Per Game
                </th>
                <th className="px-3 py-2 font-bold text-blue-600 dark:text-blue-400 text-center">
                  <Clock className="w-3 h-3 inline mr-0.5" />Monthly
                </th>
                <th className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400 text-center">
                  <Calendar className="w-3 h-3 inline mr-0.5" />Annual
                </th>
              </tr>
            </thead>
            <tbody>
              {SPORTS_PLANS.map((plan) => (
                <tr key={plan.key} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                  <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300 leading-tight">
                    {plan.title.replace("Player ", "").replace(" & Tournament", "")}
                  </td>
                  {(["per_game", "monthly", "annual"] as Duration[]).map((d) => {
                    const tier = plan.pricing[d];
                    return (
                      <td key={d} className="px-3 py-2.5 text-center">
                        {tier ? (
                          <span className="font-black text-slate-900 dark:text-white">
                            &#8377;{tier.price.toLocaleString("en-IN")}
                            <span className="font-normal text-[9px] text-slate-400 block">{tier.unit}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info banner */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-800/50 dark:to-indigo-950/20 rounded-2xl border border-slate-200 dark:border-slate-800">
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
