import { useState, useEffect } from "react";
import { Phone, Mail, ChevronDown, ChevronUp, Users, Shield, Loader2 } from "lucide-react";
import { communityDirectoryService } from "../../../services/communityDirectoryService";
import type { CommunityLeaderResponse } from "../../../types/api";

const ROLE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  President:        { color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200", icon: "👑" },
  "Vice President": { color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", icon: "🏛️" },
  Secretary:        { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: "📋" },
  Treasurer:        { color: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-200", icon: "💰" },
  "Sports Director":{ color: "text-sky-700",    bg: "bg-sky-50",    border: "border-sky-200",  icon: "🏆" },
  Director:         { color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", icon: "📌" },
};

function getRoleStyle(designation: string) {
  const key = Object.keys(ROLE_CONFIG).find(
    (k) => designation.toLowerCase().includes(k.toLowerCase())
  );
  return key
    ? ROLE_CONFIG[key]
    : { color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200", icon: "👤" };
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

interface GroupedLeaders {
  executives: CommunityLeaderResponse[];
  committees: Record<string, CommunityLeaderResponse[]>;
  other: CommunityLeaderResponse[];
}

function groupLeaders(leaders: CommunityLeaderResponse[]): GroupedLeaders {
  const executives: CommunityLeaderResponse[] = [];
  const committees: Record<string, CommunityLeaderResponse[]> = {};
  const other: CommunityLeaderResponse[] = [];

  for (const l of leaders) {
    const d = l.designation.toLowerCase();
    if (
      d.includes("president") ||
      d.includes("secretary") ||
      d.includes("treasurer") ||
      d.includes("director") ||
      d.includes("chairman") ||
      d.includes("chairperson")
    ) {
      executives.push(l);
    } else if (l.committee) {
      const c = l.committee;
      if (!committees[c]) committees[c] = [];
      committees[c].push(l);
    } else {
      other.push(l);
    }
  }

  return { executives, committees, other };
}

function LeaderCard({ leader }: { leader: CommunityLeaderResponse }) {
  const style = getRoleStyle(leader.designation);

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${style.border} ${style.bg} transition-all hover:shadow-sm`}>
      {leader.profilePicUrl ? (
        <img
          src={leader.profilePicUrl}
          alt={leader.fullName}
          className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
        />
      ) : (
        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 border-white shadow-sm flex-shrink-0 ${style.bg} ${style.color}`}>
          {getInitials(leader.fullName)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-slate-900 truncate">{leader.fullName}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${style.bg} ${style.color} border ${style.border}`}>
            {style.icon} {leader.designation}
          </span>
        </div>
        {(leader.flatNo || leader.block) && (
          <p className="text-[11px] text-slate-500 mt-0.5">
            {[leader.flatNo && `Flat ${leader.flatNo}`, leader.block && `Block ${leader.block}`].filter(Boolean).join(" · ")}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {leader.contactPhone && (
            <a
              href={`tel:${leader.contactPhone}`}
              className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <Phone className="w-3 h-3" /> {leader.contactPhone}
            </a>
          )}
          {leader.contactEmail && (
            <a
              href={`mailto:${leader.contactEmail}`}
              className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-indigo-600 transition-colors truncate"
            >
              <Mail className="w-3 h-3" /> {leader.contactEmail}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommunityDirectory() {
  const [leaders, setLeaders] = useState<CommunityLeaderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    let cancelled = false;
    communityDirectoryService
      .getDirectory()
      .then((data) => {
        if (!cancelled) setLeaders(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load directory");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading community directory...</span>
        </div>
      </div>
    );
  }

  if (error || leaders.length === 0) return null;

  const { executives, committees, other } = groupLeaders(leaders);
  const committeeNames = Object.keys(committees).sort();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Community Directory</h3>
            <p className="text-[11px] text-slate-500">Leadership, committees & contacts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {leaders.length} {leaders.length === 1 ? "member" : "members"}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Executive Leadership */}
          {executives.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Leadership
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="space-y-2">
                {executives.map((l) => (
                  <LeaderCard key={l.id} leader={l} />
                ))}
              </div>
            </div>
          )}

          {/* Committees */}
          {committeeNames.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Committees
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              {committeeNames.map((name) => (
                <div key={name} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">{name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({committees[name].length})
                    </span>
                  </div>
                  <div className="space-y-2 pl-1">
                    {committees[name].map((l) => (
                      <LeaderCard key={l.id} leader={l} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Other roles */}
          {other.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Community Roles
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="space-y-2">
                {other.map((l) => (
                  <LeaderCard key={l.id} leader={l} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
