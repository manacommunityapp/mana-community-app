import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";
import {
  Phone, Mail, ChevronDown, ChevronUp, Users, Shield, Loader2,
  HelpCircle, Wrench, Banknote, Megaphone, HeartHandshake,
  AlertTriangle, Trophy, Building2, Baby, Landmark, MessageSquare
} from "lucide-react";
import { communityDirectoryService } from "../../../services/communityDirectoryService";
import type { CommunityLeaderResponse } from "../../../types/api";
import { useChat } from "../../../contexts/ChatContext";

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

const handlePhoneClick = (fullName: string, phone: string) => {
  Swal.fire({
    title: "",
    html: `
      <div class="font-sans px-1 text-center space-y-5">
        <!-- Header Profile icon -->
        <div class="flex flex-col items-center gap-3.5 pt-2">
          <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-800 tracking-wide">${fullName}</h3>
            <p class="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">Community Directory Member</p>
          </div>
        </div>

        <!-- Phone Card Display -->
        <div class="bg-indigo-50/50 border border-indigo-100/60 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 shadow-inner">
          <span class="text-[9px] uppercase font-bold tracking-widest text-indigo-500">Mobile Number</span>
          <span class="text-lg font-mono font-extrabold text-indigo-700 select-all tracking-wide">${phone}</span>
        </div>

        <p class="text-[10px] text-slate-450 leading-relaxed font-semibold">Select the number text to highlight &amp; copy, or select an option below</p>
      </div>
    `,
    showCancelButton: true,
    showDenyButton: true,
    buttonsStyling: false,
    confirmButtonText: "Call Now",
    denyButtonText: "Copy Number",
    cancelButtonText: "Close",
    customClass: {
      popup: "rounded-3xl border border-slate-200/50 shadow-2xl bg-white p-6 max-w-[340px] w-full",
      actions: "flex items-center justify-center gap-2.5 mt-5 w-full",
      confirmButton: "flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-white text-[11px] font-bold shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all active:scale-95 cursor-pointer bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-650 hover:to-violet-750",
      denyButton: "flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-slate-700 text-[11px] font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95 cursor-pointer",
      cancelButton: "flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-slate-500 text-[11px] font-bold border border-slate-200 bg-white hover:bg-slate-50 transition-all active:scale-95 cursor-pointer",
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = `tel:${phone}`;
    } else if (result.isDenied) {
      navigator.clipboard.writeText(phone);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Copied to clipboard",
        showConfirmButton: false,
        timer: 1500
      });
    }
  });
};

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
    let isExec = false;
    
    if (EXECUTIVE_KEYWORDS.some((kw) => d.includes(kw))) {
      executives.push(l);
      isExec = true;
    }
    
    if (l.committee) {
      const c = l.committee;
      if (!committees[c]) committees[c] = [];
      if (!committees[c].some(x => x.userId === l.userId)) {
        committees[c].push(l);
      }
    } else if (!isExec) {
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
    let match: CommunityLeaderResponse | null = leaders.find((l) => {
      const d = l.designation.toLowerCase();
      const c = (l.committee || "").toLowerCase();
      return s.keywords.some((kw) => d.includes(kw) || c.includes(kw));
    }) || null;
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
  const { openFloatingChatWithUser } = useChat();
  return (
    <div className="relative p-2.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all hover:shadow-sm flex items-center justify-between gap-3 text-left">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {leader.profilePicUrl ? (
          <img
            src={leader.profilePicUrl}
            alt={leader.fullName}
            className={`h-10 w-10 rounded-full object-cover ring-2 ${style.avatarRing} shadow-sm flex-shrink-0`}
          />
        ) : (
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs ring-2 ${style.avatarRing} shadow-sm flex-shrink-0 ${style.bg} ${style.color}`}>
            {getInitials(leader.fullName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="font-semibold text-xs text-slate-800 truncate">{leader.fullName}</span>
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${style.bg} ${style.color} border ${style.border} shrink-0`}>
              <span>{style.icon}</span>
              <span>{leader.designation}</span>
            </span>
            {(leader.flatNo || leader.block) && (
              <span className="text-[9px] text-slate-400 font-medium shrink-0">
                {[leader.flatNo && `Flat ${leader.flatNo}`, leader.block && `Block ${leader.block}`].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => openFloatingChatWithUser(String(leader.userId))}
          className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200/60 transition-colors cursor-pointer"
          title={`Chat with ${leader.fullName}`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
        {leader.contactPhone && (
          <button
            onClick={() => handlePhoneClick(leader.fullName, leader.contactPhone!)}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200/60 transition-colors cursor-pointer"
            title={`View contact number for ${leader.fullName}`}
          >
            <Phone className="w-3.5 h-3.5" />
          </button>
        )}
        {leader.contactEmail && (
          <a
            href={`mailto:${leader.contactEmail}`}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200/60 transition-colors"
            title={`Email ${leader.fullName} (${leader.contactEmail})`}
          >
            <Mail className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function CompactCard({ leader }: { leader: CommunityLeaderResponse }) {
  const style = getRoleStyle(leader.designation);
  const { openFloatingChatWithUser } = useChat();
  return (
    <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-white border border-slate-100 hover:border-slate-200 transition-all hover:shadow-sm text-left">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {leader.profilePicUrl ? (
          <img
            src={leader.profilePicUrl}
            alt={leader.fullName}
            className={`h-8 w-8 rounded-full object-cover ring-1 ${style.avatarRing} flex-shrink-0`}
          />
        ) : (
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[10px] ring-1 ${style.avatarRing} flex-shrink-0 ${style.bg} ${style.color}`}>
            {getInitials(leader.fullName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="font-semibold text-xs text-slate-800 truncate">{leader.fullName}</span>
            <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wide px-1 py-0.2 rounded ${style.bg} ${style.color} shrink-0`}>
              <span>{style.icon}</span>
              <span>{leader.designation}</span>
            </span>
            {(leader.flatNo || leader.block) && (
              <span className="text-[9px] text-slate-400 font-medium shrink-0">
                {[leader.flatNo && `Flat ${leader.flatNo}`, leader.block && `Block ${leader.block}`].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => openFloatingChatWithUser(String(leader.userId))}
          className="p-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-slate-100 transition-colors cursor-pointer"
          title={`Chat with ${leader.fullName}`}
        >
          <MessageSquare className="w-3 h-3" />
        </button>
        {leader.contactPhone && (
          <button
            onClick={() => handlePhoneClick(leader.fullName, leader.contactPhone!)}
            className="p-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-slate-100 transition-colors cursor-pointer"
            title={`View contact number for ${leader.fullName}`}
          >
            <Phone className="w-3 h-3" />
          </button>
        )}
        {leader.contactEmail && (
          <a
            href={`mailto:${leader.contactEmail}`}
            className="p-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-slate-100 transition-colors"
            title={`Email ${leader.fullName} (${leader.contactEmail})`}
          >
            <Mail className="w-3 h-3" />
          </a>
        )}
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
  const navigate = useNavigate();
  const { openFloatingChatWithUser } = useChat();
  const [leaders, setLeaders] = useState<CommunityLeaderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
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
             <div className="flex gap-0.5 mb-4 bg-slate-100/80 p-0.5 rounded-lg flex-nowrap">
               {tabs.map((t) => (
                 <button
                   key={t.id}
                   onClick={() => setTab(t.id)}
                   className={`flex-1 flex items-center justify-center gap-1 px-1 sm:px-3 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                     tab === t.id
                       ? "bg-white text-indigo-700 shadow-sm"
                       : "text-slate-500 hover:text-slate-700"
                   }`}
                 >
                   {t.icon}
                   <span>{t.label}</span>
                   {t.count !== undefined && (
                     <span className={`text-[8px] px-1 py-0.2 rounded-full ${
                       tab === t.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-200/80 text-slate-500"
                     }`}>
                       {t.count}
                     </span>
                   )}
                 </button>
               ))}
             </div>
           )}

          <div className="max-h-[350px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent space-y-1">
            {/* ── Leadership Tab ──────────────────────────────────── */}
          {tab === "leadership" && (
            <div className="space-y-3">
              {executives.length > 0 ? (
                <>
                  <SectionDivider label="Executive Committee" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
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
                      <button
                        onClick={() => openFloatingChatWithUser(String(leader.userId))}
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-indigo-600 transition-colors border border-slate-200/60 cursor-pointer"
                        title={`Chat with ${leader.fullName}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      {leader.contactPhone && (
                        <button
                          onClick={() => handlePhoneClick(leader.fullName, leader.contactPhone!)}
                          className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-indigo-600 transition-colors border border-slate-200/60 cursor-pointer"
                          title={`View contact number for ${leader.fullName}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
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
        </div>
      )}
    </div>
  );
}
