import { useState } from "react";
import { Link } from "react-router";
import { ShieldCheck, X, ChevronRight, Zap } from "lucide-react";

type BannerVariant = "pa" | "event" | "team";

interface BannerConfig {
  key: InsuranceCategory;
  headline: string;
  sub: string;
  cta: string;
  price: string;
  color: string;
  bg: string;
  border: string;
}

type InsuranceCategory = "SPORTS_PA" | "SPORTS_EVENT_LIABILITY" | "SPORTS_TEAM_GROUP";

const CONFIGS: Record<BannerVariant, BannerConfig> = {
  pa: {
    key: "SPORTS_PA",
    headline: "Playing today? Activate cover in 30 seconds",
    sub: "Sports injury cover from ₹49/game — fractures, physio & more",
    cta: "Get Per-Game Cover",
    price: "from ₹49",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  event: {
    key: "SPORTS_EVENT_LIABILITY",
    headline: "Organising a tournament?",
    sub: "Event & third-party liability cover from ₹999/day",
    cta: "Cover Your Event",
    price: "from ₹999",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
  },
  team: {
    key: "SPORTS_TEAM_GROUP",
    headline: "Cover your whole team for ₹199/player/year",
    sub: "Group policy — fractures, hospitalization, disability in one plan",
    cta: "Get Team Cover",
    price: "from ₹199/player",
    color: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
  },
};

interface Props {
  variant?: BannerVariant;
  dismissable?: boolean;
  compact?: boolean;
}

const DISMISSED_KEY = "mana_insurance_banner_dismissed_v1";

function getDismissed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function saveDismissed(s: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...s]));
  } catch {}
}

export function SportsInsuranceBanner({ variant = "pa", dismissable = true, compact = false }: Props) {
  const [dismissed, setDismissed] = useState(() => getDismissed());
  const cfg = CONFIGS[variant];

  if (dismissed.has(variant)) return null;

  function dismiss() {
    const next = new Set(dismissed);
    next.add(variant);
    saveDismissed(next);
    setDismissed(next);
  }

  if (compact) {
    return (
      <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
          <span className={`text-[11px] font-semibold truncate ${cfg.color}`}>{cfg.headline}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link
            to={`/sports/insurance`}
            className={`text-[10px] font-black px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border ${cfg.border} ${cfg.color} hover:opacity-80 transition`}
          >
            {cfg.price}
          </Link>
          {dismissable && (
            <button type="button" onClick={dismiss} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl border ${cfg.bg} ${cfg.border} px-4 py-3.5`}>
      {dismissable && (
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <div className="flex items-start gap-3 pr-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white dark:bg-slate-900 border ${cfg.border}`}>
          <ShieldCheck className={`w-5 h-5 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-black ${cfg.color} leading-tight`}>{cfg.headline}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{cfg.sub}</p>
          <div className="flex items-center gap-2 mt-2">
            <Link
              to={`/sports/insurance`}
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border ${cfg.border} ${cfg.color} hover:opacity-80 transition`}
            >
              <Zap className="w-3 h-3" />
              {cfg.cta}
            </Link>
            <Link
              to={`/insurance?tab=catalogue&category=${cfg.key}`}
              className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-slate-600 transition"
            >
              Compare plans <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
