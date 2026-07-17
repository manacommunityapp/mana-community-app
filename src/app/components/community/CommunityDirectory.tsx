import { useState, useEffect, useMemo } from "react";
import {
  Phone, Mail, ChevronDown, ChevronUp, Users, Shield, Loader2,
  HelpCircle, Wrench, Banknote, Megaphone, HeartHandshake,
  AlertTriangle, Trophy, Building2, Baby, Landmark
} from "lucide-react";
import { communityDirectoryService } from "../../../services/communityDirectoryService";
import type { CommunityLeaderResponse } from "../../../types/api";

// ── Role styling ────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, {
  color: string; bg: string; border: string; icon: string;
  textDark: string; avatarRing: string;
}> = {
  President:          { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: "👑", textDark: "text-amber-800",   avatarRing: "ring-amber-300" },
  "Vice President":   { color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200",  icon: "🏛️", textDark: "text-indigo-800",  avatarRing: "ring-indigo-300" },
  Secretary:          { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: "📋", textDark: "text-emerald-800", avatarRing: "ring-emerald-300" },
  "Joint Secretary":  { color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200",    icon: "📝", textDark: "text-teal-800",    avatarRing: "ring-teal-300" },
  Treasurer:          { color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",    icon: "💰", textDark: "text-rose-800",    avatarRing: "ring-rose-300" },
  "Sports Director":  { color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200",     icon: "🏆", textDark: "text-sky-800",     avatarRing: "ring-sky-300" },
  Director:           { color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200",  icon: "📌", textDark: "text-violet-800",  avatarRing: "ring-violet-300" },
  Chairman:           { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: "⭐", textDark: "text-amber-800",   avatarRing: "ring-amber-300" },
  Chairperson:        { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: "⭐", textDark: "text-amber-800",   avatarRing: "ring-amber-300" },
  "Cultural Head":    { color: "text-pink-700",    bg: "bg-pink-50",    border: "border-pink-200",    icon: "🎭", textDark: "text-pink-800",    avatarRing: "ring-pink-300" },
  "Maintenance Head": { color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200",  icon: "🔧", textDark: "text-orange-800",  avatarRing: "ring-orange-300" },
  "Security Head":    { color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     icon: "🛡️", textDark: "text-red-800",     avatarRing: "ring-red-300" },
  "Grievance Officer":{ color: "text-cyan-700",    bg: "bg-cyan-50",    border: "border-cyan-200",    icon: "📢", textDark: "text-cyan-800",    avatarRing: "ring-cyan-300" },
  Member:             { color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200",   icon: "👤", textDark: "text-slate-700",   avatarRing: "ring-slate-300" },
};

function getRoleStyle(designation: string) {
  const key = Object.keys(ROLE_CONFIG).find(
    (k) => designation.toLowerCase().includes(k.toLowerCase())
  );
  return key
    ? ROLE_CONFIG[key]
    : { color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", icon: "👤", textDark: "text-slate-700", avatarRing: "ring-slate-300" };
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ── Grouping ────────────────────────────────────────────────────────────────

interface GroupedLeaders {
  executives: CommunityLeaderResponse[];
  committees: Record<string, CommunityLeaderResponse[]>;
  other: CommunityLeaderResponse[];
}

const EXECUTIVE_KEYWORDS = [
  "president", "secretary", "treasurer", "director",
  "chairman", "chairperson", "head",
];

function groupLeaders(leaders: CommunityLeaderResponse[]): GroupedLeaders {
  const executives: CommunityLeaderResponse[] = [];
  const committees: Record<string, CommunityLeaderResponse[]> = {};
  const other: CommunityLeaderResponse[] = [];

  for (const l of leaders) {
    const d = l.designation.toLowerCase();
    if (EXECUTIVE_KEYWORDS.some((kw) => d.includes(kw))) {
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

// ── "Who to Contact" mapping ────────────────────────────────────────────────

interface ContactSuggestion {
  issue: string;
  icon: React.ReactNode;
  keywords: string[];
  fallbackKeywords: string[];
  color: string;
}

const CONTACT_SUGGESTIONS: ContactSuggestion[] = [
  { issue: "Maintenance & Repairs",    icon: <Wrench className="w-4 h-4" />,          keywords: ["maintenance"], fallbackKeywords: ["secretary"],       color: "text-orange-600 bg-orange-50 border-orange-200" },
  { issue: "Financial & Payments",     icon: <Banknote className="w-4 h-4" />,         keywords: ["treasurer", "finance"], fallbackKeywords: ["secretary"], color: "text-rose-600 bg-rose-50 border-rose-200" },
  { issue: "Sports & Events",          icon: <Trophy className="w-4 h-4" />,           keywords: ["sports"],  fallbackKeywords: ["director", "cultural"],       color: "text-sky-600 bg-sky-50 border-sky-200" },
  { issue: "Cultural Programs",        icon: <Megaphone className="w-4 h-4" />,        keywords: ["cultural"], fallbackKeywords: ["vice president"],  color: "text-pink-600 bg-pink-50 border-pink-200" },
  { issue: "Security Concerns",        icon: <AlertTriangle className="w-4 h-4" />,    keywords: ["security"], fallbackKeywords: ["secretary"],       color: "text-red-600 bg-red-50 border-red-200" },
  { issue: "Complaints & Grievances",  icon: <HelpCircle className="w-4 h-4" />,       keywords: ["grievance"], fallbackKeywords: ["president", "secretary"], color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  { issue: "Community Welfare",        icon: <HeartHandshake className="w-4 h-4" />,   keywords: ["welfare", "women", "senior"], fallbackKeywords: ["vice president"], color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { issue: "Building & Infrastructure",icon: <Building2 className="w-4 h-4" />,        keywords: ["building", "infrastructure"], fallbackKeywords: ["maintenance", "director"], color: "text-amber-600 bg-amber-50 border-amber-200" },
];

function resolveContacts(
  leaders: CommunityLeaderResponse[],
  suggestions: ContactSuggestion[]
): { issue: string; icon: React.ReactNode; color: string; leader: CommunityLeaderResponse | null }[] {
  return suggestions.map((s) => {
    let match = leaders.find((l) => {
      const d = l.designation.toLowerCase();
      const c = (l.committee || "").toLowerCase();
      return s.keywords.some((kw) => d.includes(kw) || c.includes(kw));
    });
    if (!match) {
      match = leaders.find((l) => {
        const d = l.designation.toLowerCase();
        return s.fallbackKeywords.some((kw) => d.includes(kw));
      }) || null;
    }
    return { issue: s.issue, icon: s.icon, color: s.color, leader: match };
  }).filter((r) => r.leader !== null);
}

// ── Tab type ────────────────────────────────────────────────────────────────

type DirectoryTab = "leadership" | "committees" | "contact";

// ── Components ──────────────────────────────────────────────────────────────

function ExecutiveCard({ leader }: { leader: CommunityLeaderResponse }) {
  const style = getRoleStyle(leader.designation);
  return (
    <div className={`relative p-4 rounded-xl border ${style.border} ${style.bg} transition-all hover:shadow-md group`}>
      <div className="flex items-center gap-3.5">
        {leader.profilePicUrl ? (
          <img
            src={leader.profilePicUrl}
            alt={leader.fullName}
            className={`h-14 w-14 rounded-full object-cover ring-2 ${style.avatarRing} shadow-sm flex-shrink-0`}
          />
        ) : (
          <div className={`h-14 w-14 rounded-full flex items-center justify-center font-bold text-lg ring-2 ${style.avatarRing} shadow-sm flex-shrink-0 bg-white/80 ${style.color}`}>
            {getInitials(leader.fullName)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-slate-900">{leader.fullName}</span>
          </div>
          <div className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${style.bg} ${style.color} border ${style.border}`}>
            <span>{style.icon}</span>
            <span>{leader.designation}</span>
          </div>
          {(leader.flatNo || leader.block) && (
            <p className="text-[10px] text-slate-500 mt-1">
              {[leader.flatNo && `Flat ${leader.flatNo}`, leader.block && `Block ${leader.block}`].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dashed border-slate-200/60 flex-wrap">
        {leader.contactPhone && (
          <a
            href={`tel:${leader.contactPhone}`}
            className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-indigo-600 transition-colors bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200/60"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{leader.contactPhone}</span>
          </a>
        )}
        {leader.contactEmail && (
          <a
            href={`mailto:${leader.contactEmail}`}
            className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-indigo-600 transition-colors bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200/60 truncate max-w-[200px]"
          >
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{leader.contactEmail}</span>
          </a>
        )}
      </div>
    </div>
  );
}

function CompactCard({ leader }: { leader: CommunityLeaderResponse }) {
  const style = getRoleStyle(leader.designation);
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-slate-100 hover:border-slate-200 transition-all hover:shadow-sm">
      {leader.profilePicUrl ? (
        <img
          src={leader.profilePicUrl}
          alt={leader.fullName}
          className={`h-9 w-9 rounded-full object-cover ring-1 ${style.avatarRing} flex-shrink-0`}
        />
      ) : (
        <div className={`h-9 w-9 rounded-full flex items-center justify-center font-semibold text-xs ring-1 ${style.avatarRing} flex-shrink-0 ${style.bg} ${style.color}`}>
          {getInitials(leader.fullName)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-xs text-slate-800 truncate">{leader.fullName}</span>
          <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${style.bg} ${style.color}`}>
            {style.icon} {leader.designation}
          </span>
        </div>
        <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
          {leader.contactPhone && (
            <a href={`tel:${leader.contactPhone}`} className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-0.5">
              <Phone className="w-2.5 h-2.5" /> {leader.contactPhone}
            </a>
          )}
          {leader.contactEmail && (
            <a href={`mailto:${leader.contactEmail}`} className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-0.5 truncate max-w-[160px]">
              <Mail className="w-2.5 h-2.5 flex-shrink-0" /> <span className="truncate">{leader.contactEmail}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-1">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function CommunityDirectory() {
  const [leaders, setLeaders] = useState<CommunityLeaderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [tab, setTab] = useState<DirectoryTab>("leadership");
  const [expandedCommittees, setExpandedCommittees] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    communityDirectoryService
      .getDirectory()
      .then((data) => { if (!cancelled) setLeaders(data); })
      .catch((err) => { if (!cancelled) setError(err.message ?? "Failed to load directory"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const { executives, committees, other } = useMemo(() => groupLeaders(leaders), [leaders]);
  const committeeNames = useMemo(() => Object.keys(committees).sort(), [committees]);
  const contactMap = useMemo(() => resolveContacts(leaders, CONTACT_SUGGESTIONS), [leaders]);
  const hasCommittees = committeeNames.length > 0 || other.length > 0;

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

  const tabs: { id: DirectoryTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "leadership", label: "Leadership", icon: <Landmark className="w-3.5 h-3.5" />, count: executives.length },
    ...(hasCommittees ? [{ id: "committees" as DirectoryTab, label: "Committees", icon: <Users className="w-3.5 h-3.5" />, count: committeeNames.length + (other.length > 0 ? 1 : 0) }] : []),
    ...(contactMap.length > 0 ? [{ id: "contact" as DirectoryTab, label: "Who to Contact", icon: <HelpCircle className="w-3.5 h-3.5" /> }] : []),
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-sm">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Community Directory</h3>
            <p className="text-[11px] text-slate-500">Leadership, committees & contacts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
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
        <div className="px-5 pb-5">
          {/* Tab Navigation */}
          {tabs.length > 1 && (
            <div className="flex gap-1 mb-4 bg-slate-100/80 p-1 rounded-lg">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                    tab === t.id
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      tab === t.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-200/80 text-slate-500"
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Leadership Tab ──────────────────────────────────── */}
          {tab === "leadership" && (
            <div className="space-y-3">
              {executives.length > 0 ? (
                <>
                  <SectionDivider label="Executive Committee" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {executives.map((l) => (
                      <ExecutiveCard key={l.id} leader={l} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-sm text-slate-400">
                  No executive leadership listed yet.
                </div>
              )}
            </div>
          )}

          {/* ── Committees Tab ──────────────────────────────────── */}
          {tab === "committees" && (
            <div className="space-y-3">
              {committeeNames.map((name) => {
                const isOpen = expandedCommittees[name] !== false;
                const members = committees[name];
                return (
                  <div key={name} className="rounded-lg border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setExpandedCommittees((prev) => ({ ...prev, [name]: !isOpen }))}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-700">{name}</span>
                        <span className="text-[9px] font-medium text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded-full">
                          {members.length} {members.length === 1 ? "member" : "members"}
                        </span>
                      </div>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                    {isOpen && (
                      <div className="p-2.5 space-y-1.5 bg-white">
                        {members.map((l) => (
                          <CompactCard key={l.id} leader={l} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {other.length > 0 && (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedCommittees((prev) => ({ ...prev, __other: !(prev.__other !== false) }))}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-bold text-slate-700">Community Roles</span>
                      <span className="text-[9px] font-medium text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded-full">
                        {other.length}
                      </span>
                    </div>
                    {expandedCommittees.__other !== false
                      ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                  {expandedCommittees.__other !== false && (
                    <div className="p-2.5 space-y-1.5 bg-white">
                      {other.map((l) => (
                        <CompactCard key={l.id} leader={l} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {committeeNames.length === 0 && other.length === 0 && (
                <div className="text-center py-8 text-sm text-slate-400">
                  No committees configured yet.
                </div>
              )}
            </div>
          )}

          {/* ── Who to Contact Tab ─────────────────────────────── */}
          {tab === "contact" && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 mb-3">
                Facing an issue? Here's who to reach out to in your community.
              </p>
              {contactMap.map(({ issue, icon, color, leader }) => {
                if (!leader) return null;
                const [colorBase] = color.split(" ");
                return (
                  <div
                    key={issue}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${color}`}
                  >
                    <div className={`p-2 rounded-lg bg-white/70 ${colorBase} flex-shrink-0`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800">{issue}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-slate-700">{leader.fullName}</span>
                        <span className="text-[9px] text-slate-500">({leader.designation})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {leader.contactPhone && (
                        <a
                          href={`tel:${leader.contactPhone}`}
                          className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-indigo-600 transition-colors border border-slate-200/60"
                          title={`Call ${leader.fullName}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {leader.contactEmail && (
                        <a
                          href={`mailto:${leader.contactEmail}`}
                          className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-indigo-600 transition-colors border border-slate-200/60"
                          title={`Email ${leader.fullName}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

              {contactMap.length === 0 && (
                <div className="text-center py-8 text-sm text-slate-400">
                  No contact mappings available yet.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
