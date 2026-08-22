import { useState, useEffect, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import {
  Phone, Mail, ChevronDown, ChevronUp, Users, Shield, Loader2,
  HelpCircle, Wrench, Banknote, Megaphone, HeartHandshake,
  AlertTriangle, Trophy, Building2, Landmark, MessageSquare,
  Search, X, Sparkles, UserCheck, MapPin, History, Crown, Award, Clock
} from "lucide-react";
import { communityDirectoryService } from "../../../services/community/communityDirectoryService";
import { whoToCallService } from "../../../services/community/whoToCallService";
import type { CommunityLeaderResponse, CommunityWhoToCallResponse, CommunityLeaderHistoryResponse } from "../../../types/api";
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
      <div class="font-sans px-1 text-center space-y-4">
        <div class="flex flex-col items-center gap-2.5 pt-2">
          <div class="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-800 tracking-tight">${fullName}</h3>
            <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Directory Member</p>
          </div>
        </div>

        <div class="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 flex flex-col items-center justify-center gap-1 shadow-2xs">
          <span class="text-[9px] uppercase font-bold tracking-widest text-emerald-600">Contact Number</span>
          <span class="text-base font-mono font-extrabold text-emerald-800 select-all">${phone}</span>
        </div>

        <p class="text-[10px] text-slate-400 font-medium">Tap Call Now to dial directly, or Copy to save</p>
      </div>
    `,
    showCancelButton: true,
    showDenyButton: true,
    buttonsStyling: false,
    confirmButtonText: "Call Now",
    denyButtonText: "Copy",
    cancelButtonText: "Close",
    customClass: {
      popup: "rounded-3xl border border-slate-200/80 shadow-2xl bg-white p-5 max-w-[320px] w-full",
      actions: "flex items-center justify-center gap-2 mt-4 w-full",
      confirmButton: "flex-1 inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600",
      denyButton: "flex-1 inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl text-slate-700 text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95 cursor-pointer",
      cancelButton: "px-3 py-2.5 rounded-xl text-slate-400 text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer",
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

// ── Availability / Working-hours badge ──────────────────────────────────────

type AvailabilityStatus = "open" | "closed" | "unknown";

const DAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

/** Convert "9am", "9:00 AM", "09:00" etc. → fractional hours (9.0, 13.5 …) */
function parseHour(raw?: string): number | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  // "9:30am" / "9:30 am"
  const full = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (full && full[1] && full[2]) {
    let h = parseInt(full[1], 10);
    const m = parseInt(full[2], 10);
    const period = full[3];
    if (period === "pm" && h < 12) h += 12;
    if (period === "am" && h === 12) h = 0;
    return h + m / 60;
  }
  // "9am" / "9 pm"
  const simple = s.match(/^(\d{1,2})\s*(am|pm)?$/);
  if (simple && simple[1]) {
    let h = parseInt(simple[1], 10);
    const period = simple[2];
    if (period === "pm" && h < 12) h += 12;
    if (period === "am" && h === 12) h = 0;
    return h;
  }
  return null;
}

/** Parse "Mon-Fri" or "Mon–Sat" etc. → [startDay, endDay] (0-6) */
function parseDayRange(raw?: string): [number, number] | null {
  if (!raw) return null;
  const parts = raw.toLowerCase().split(/[-–]/);
  if (parts.length === 2 && parts[0] && parts[1]) {
    const start = DAY_MAP[parts[0].trim()];
    const end = DAY_MAP[parts[1].trim()];
    if (start !== undefined && end !== undefined) return [start, end];
  }
  if (parts.length === 1 && parts[0]) {
    const d = DAY_MAP[parts[0].trim()];
    if (d !== undefined) return [d, d];
  }
  return null;
}

/**
 * Parse an availability string and determine if "now" falls within it.
 * Handles: "24/7", "Mon-Fri 9am-6pm", "Mon–Sat 9:00 AM – 5:00 PM", "Weekdays 9am-5pm" etc.
 */
export function parseAvailabilityStatus(availability?: string): AvailabilityStatus {
  if (!availability) return "unknown";
  const s = availability.toLowerCase().trim();

  // Always-open patterns
  if (/24\s*[/x]\s*7|always|round.the.clock/i.test(s)) return "open";

  const now = new Date();
  const currentDay = now.getDay(); // 0=Sun…6=Sat
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Normalise "weekdays" → "mon-fri", "weekends" → "sat-sun"
  const normalised = s
    .replace(/weekdays?/g, "mon-fri")
    .replace(/weekends?/g, "sat-sun");

  // Split on comma or semicolon to support "Mon-Fri 9am-6pm, Sat 10am-2pm"
  const segments = normalised.split(/[,;]/);

  for (const seg of segments) {
    const trimmed = seg.trim();
    // Try to isolate a day-range token and time-range tokens
    const dayPart = trimmed.match(/[a-z]{3,}[-–][a-z]{3,}|[a-z]{3,}/)?.[0] ?? "";
    const dayRange = parseDayRange(dayPart);

    // Extract time range: two time tokens separated by - or –
    const timeTokens = trimmed.match(/\d{1,2}(?::\d{2})?\s*(?:am|pm)?/g) ?? [];
    let openHour: number | null = null;
    let closeHour: number | null = null;
    if (timeTokens.length >= 2 && timeTokens[0] && timeTokens[1]) {
      openHour = parseHour(timeTokens[0]);
      closeHour = parseHour(timeTokens[1]);
    }

    // Check day
    let dayMatch = false;
    if (!dayRange) {
      dayMatch = true; // No day info → treat as every day
    } else {
      const [dStart, dEnd] = dayRange;
      dayMatch = dStart <= dEnd
        ? currentDay >= dStart && currentDay <= dEnd
        : currentDay >= dStart || currentDay <= dEnd; // wrap e.g. Sat-Mon
    }

    if (!dayMatch) continue;

    // Check time
    if (openHour === null || closeHour === null) {
      return "open"; // Day matches, no time restriction → open
    }
    if (currentHour >= openHour && currentHour < closeHour) return "open";
  }

  return "closed";
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
    const d = (l.designation || "").toLowerCase();
    let isExec = false;
    
    if (EXECUTIVE_KEYWORDS.some((kw) => d.includes(kw))) {
      executives.push(l);
      isExec = true;
    }
    
    if (l.committee && l.committee.trim()) {
      const c = l.committee.trim();
      if (!committees[c]) committees[c] = [];
      if (!committees[c].some(x => x.id === l.id)) {
        committees[c].push(l);
      }
    }
    
    if (!isExec && (!l.committee || !l.committee.trim())) {
      other.push(l);
    }
  }

  // If no executives explicitly found, make all leaders visible in council tab
  if (executives.length === 0 && other.length > 0) {
    executives.push(...other);
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
  { issue: "Financial & Accounts",     icon: <Banknote className="w-4 h-4" />,         keywords: ["treasurer", "finance"], fallbackKeywords: ["secretary"], color: "text-rose-600 bg-rose-50 border-rose-200" },
  { issue: "Sports & Tournaments",     icon: <Trophy className="w-4 h-4" />,           keywords: ["sports"],  fallbackKeywords: ["director", "cultural"],       color: "text-sky-600 bg-sky-50 border-sky-200" },
  { issue: "Cultural & Festivals",     icon: <Megaphone className="w-4 h-4" />,        keywords: ["cultural"], fallbackKeywords: ["vice president"],  color: "text-pink-600 bg-pink-50 border-pink-200" },
  { issue: "Security & Gate Passes",   icon: <AlertTriangle className="w-4 h-4" />,    keywords: ["security"], fallbackKeywords: ["secretary"],       color: "text-red-600 bg-red-50 border-red-200" },
  { issue: "Complaints & Helpdesk",    icon: <HelpCircle className="w-4 h-4" />,       keywords: ["grievance"], fallbackKeywords: ["president", "secretary"], color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  { issue: "Resident Welfare",         icon: <HeartHandshake className="w-4 h-4" />,   keywords: ["welfare", "women", "senior"], fallbackKeywords: ["vice president"], color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { issue: "Infrastructure & Civil",   icon: <Building2 className="w-4 h-4" />,        keywords: ["building", "infrastructure"], fallbackKeywords: ["maintenance", "director"], color: "text-amber-600 bg-amber-50 border-amber-200" },
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

type DirectoryTab = "leadership" | "committees" | "contact";

// ── Enhanced Leader Card ────────────────────────────────────────────────────

function DirectoryMemberCard({ leader, isModal }: { leader: CommunityLeaderResponse; isModal?: boolean }) {
  const style = getRoleStyle(leader.designation);
  const { openFloatingChatWithUser } = useChat();

  const unitDetails = [
    leader.block && `Block ${leader.block}`,
    leader.flatNo && `Flat ${leader.flatNo}`,
  ].filter(Boolean).join(" · ");

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between gap-3 text-left group">
      {/* Top Details */}
      <div className="flex items-start gap-3 min-w-0">
        {leader.profilePicUrl ? (
          <img
            src={leader.profilePicUrl}
            alt={leader.fullName}
            className={`h-11 w-11 rounded-2xl object-cover ring-2 ${style.avatarRing} shadow-xs shrink-0`}
          />
        ) : (
          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-xs ring-2 ${style.avatarRing} shadow-xs shrink-0 ${style.bg} ${style.color}`}>
            {getInitials(leader.fullName)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
              {leader.fullName}
            </h4>
            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${style.bg} ${style.color} border ${style.border} shrink-0`}>
              <span>{style.icon}</span>
              <span>{leader.designation}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-1">
            {unitDetails && (
              <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{unitDetails}</span>
              </div>
            )}

            {leader.committee && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/80">
                <Users className="w-2.5 h-2.5 text-indigo-500" />
                <span className="truncate">{leader.committee}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Contact Actions Strip */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
        {leader.contactPhone ? (
          <button
            type="button"
            onClick={() => handlePhoneClick(leader.fullName, leader.contactPhone!)}
            className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
            title={`Call ${leader.fullName}`}
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{leader.contactPhone}</span>
          </button>
        ) : (
          <div className="flex-1 text-[11px] text-slate-400 font-medium italic pl-1">
            No phone listed
          </div>
        )}

        <button
          type="button"
          onClick={() => openFloatingChatWithUser(String(leader.userId))}
          className="py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
          title={`Chat with ${leader.fullName}`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
          <span>Chat</span>
        </button>

        {leader.contactEmail && (
          <a
            href={`mailto:${leader.contactEmail}`}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60 transition-all shrink-0 flex items-center justify-center cursor-pointer"
            title={`Email ${leader.fullName}`}
          >
            <Mail className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export interface CommunityDirectoryProps {
  isModal?: boolean;
  defaultExpanded?: boolean;
  badgeCount?: number;
}

export function CommunityDirectory({ isModal = false, defaultExpanded = false, badgeCount }: CommunityDirectoryProps) {
  const { openFloatingChatWithUser } = useChat();
  const [leaders, setLeaders] = useState<CommunityLeaderResponse[]>([]);
  const [whoToCallDbList, setWhoToCallDbList] = useState<CommunityWhoToCallResponse[]>([]);
  const [loading, setLoading] = useState(isModal || defaultExpanded);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(isModal || defaultExpanded);
  const [hasFetched, setHasFetched] = useState(false);
  const [tab, setTab] = useState<DirectoryTab>("leadership");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCommittees, setExpandedCommittees] = useState<Record<string, boolean>>({});

  // ── Council History Modal State for Residents ──
  const [showCouncilHistoryModal, setShowCouncilHistoryModal] = useState(false);
  const [councilHistoryLogs, setCouncilHistoryLogs] = useState<CommunityLeaderHistoryResponse[]>([]);
  const [loadingCouncilHistory, setLoadingCouncilHistory] = useState(false);

  const openCouncilHistoryModal = useCallback(async () => {
    setShowCouncilHistoryModal(true);
    setLoadingCouncilHistory(true);
    try {
      const logs = await communityDirectoryService.getLeaderHistory();
      setCouncilHistoryLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error("Failed to load council history:", err);
      setCouncilHistoryLogs([]);
    } finally {
      setLoadingCouncilHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!expanded && !isModal) return;
    if (hasFetched) return;

    let cancelled = false;
    setLoading(true);
    Promise.all([
      communityDirectoryService.getDirectory().catch(() => []),
      whoToCallService.getWhoToCallList().catch(() => []),
    ])
      .then(([dirData, whoToCallData]) => {
        if (!cancelled) {
          setLeaders(Array.isArray(dirData) ? dirData : []);
          setWhoToCallDbList(Array.isArray(whoToCallData) ? whoToCallData : []);
          setHasFetched(true);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Failed to load directory");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expanded, isModal, hasFetched]);

  const filteredLeaders = useMemo(() => {
    if (!searchQuery.trim()) return leaders;
    const q = searchQuery.toLowerCase().trim();
    return leaders.filter((l) =>
      l.fullName.toLowerCase().includes(q) ||
      l.designation.toLowerCase().includes(q) ||
      (l.committee && l.committee.toLowerCase().includes(q)) ||
      (l.flatNo && l.flatNo.toLowerCase().includes(q)) ||
      (l.block && l.block.toLowerCase().includes(q)) ||
      (l.contactPhone && l.contactPhone.toLowerCase().includes(q)) ||
      (l.contactEmail && l.contactEmail.toLowerCase().includes(q))
    );
  }, [leaders, searchQuery]);

  const filteredWhoToCall = useMemo(() => {
    if (!searchQuery.trim()) return whoToCallDbList;
    const q = searchQuery.toLowerCase().trim();
    return whoToCallDbList.filter((c) =>
      c.department.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.phoneNumber.toLowerCase().includes(q) ||
      (c.designation && c.designation.toLowerCase().includes(q)) ||
      (c.locationOrDesk && c.locationOrDesk.toLowerCase().includes(q))
    );
  }, [whoToCallDbList, searchQuery]);

  const { executives, committees, other } = useMemo(() => groupLeaders(filteredLeaders), [filteredLeaders]);
  const committeeNames = useMemo(() => Object.keys(committees).sort(), [committees]);
  const contactMap = useMemo(() => resolveContacts(filteredLeaders, CONTACT_SUGGESTIONS), [filteredLeaders]);
  const hasCommittees = committeeNames.length > 0 || other.length > 0;
  const hasWhoToCall = whoToCallDbList.length > 0 || contactMap.length > 0;

  const gridClass = isModal ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "grid grid-cols-1 gap-2.5";

  if (isModal) {
    if (loading) {
      return (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6">
          <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-6">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs font-semibold text-slate-600">Loading community directory...</span>
          </div>
        </div>
      );
    }

    if (error || (leaders.length === 0 && whoToCallDbList.length === 0)) {
      return (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No directory records found</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Leadership and committee members will appear here once added.</p>
        </div>
      );
    }
  }

  const tabs: { id: DirectoryTab; label: string; icon: React.ReactNode; count?: number }[] = [
    ...(executives.length > 0 || !hasWhoToCall ? [{ id: "leadership" as DirectoryTab, label: "Council", icon: <Landmark className="w-3.5 h-3.5" />, count: executives.length }] : []),
    ...(hasCommittees ? [{ id: "committees" as DirectoryTab, label: "Committees", icon: <Users className="w-3.5 h-3.5" />, count: committeeNames.length + (other.length > 0 ? 1 : 0) }] : []),
    ...(hasWhoToCall ? [{ id: "contact" as DirectoryTab, label: "Who to Call", icon: <HelpCircle className="w-3.5 h-3.5" />, count: whoToCallDbList.length > 0 ? whoToCallDbList.length : undefined }] : []),
  ];

  const content = (
    <div className="space-y-3.5">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, designation, committee, flat..."
          className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tabs Row */}
      {tabs.length > 1 && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                tab === t.id
                  ? "bg-white text-emerald-800 shadow-sm border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  tab === t.id ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tab Contents */}
      <div className="space-y-3">
        {/* ── Leadership Tab ── */}
        {tab === "leadership" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Active Council Members ({executives.length})
              </span>
              <button
                type="button"
                onClick={openCouncilHistoryModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/70 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="View historical council appointments and past tenures"
              >
                <History className="w-3.5 h-3.5 text-violet-600" />
                <span>Past Terms &amp; History</span>
              </button>
            </div>

            {executives.length > 0 ? (
              <div className={gridClass}>
                {executives.map((l) => (
                  <DirectoryMemberCard key={l.id} leader={l} isModal={isModal} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/70">
                <p className="text-xs font-semibold text-slate-500">No council members match your search.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Committees Tab ── */}
        {tab === "committees" && (
          <div className="space-y-3">
            {committeeNames.map((name) => {
              const isOpen = expandedCommittees[name] !== false;
              const members = committees[name];
              return (
                <div key={name} className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setExpandedCommittees((prev) => ({ ...prev, [name]: !isOpen }))}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-800 block">{name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {members.length} {members.length === 1 ? "member" : "members"}
                        </span>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className={`p-3 bg-slate-50/30 ${gridClass}`}>
                      {members.map((l) => (
                        <DirectoryMemberCard key={l.id} leader={l} isModal={isModal} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {other.length > 0 && (
              <div className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => setExpandedCommittees((prev) => ({ ...prev, __other: !(prev.__other !== false) }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 block">General Community Roles</span>
                      <span className="text-[10px] text-slate-400 font-medium">{other.length} members</span>
                    </div>
                  </div>
                  {expandedCommittees.__other !== false
                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {expandedCommittees.__other !== false && (
                  <div className={`p-3 bg-slate-50/30 ${gridClass}`}>
                    {other.map((l) => (
                      <DirectoryMemberCard key={l.id} leader={l} isModal={isModal} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {committeeNames.length === 0 && other.length === 0 && (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/70">
                <p className="text-xs font-semibold text-slate-500">No committees found.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Who to Call Tab ── */}
        {tab === "contact" && (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-500 font-medium px-1">
              Need assistance? Direct contacts for community departments and services:
            </p>
            {whoToCallDbList.length > 0 ? (
              <div className={gridClass}>
                {filteredWhoToCall.map((c) => {
                  const isEmergency = Boolean(c.isEmergency);
                  const colorClass = isEmergency
                    ? "text-red-700 bg-red-50 border-red-200"
                    : c.color || "text-indigo-600 bg-indigo-50 border-indigo-200";
                  const [colorBase] = colorClass.split(" ");
                  return (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-2xl border transition-all bg-white shadow-2xs hover:shadow-sm ${
                        isEmergency ? "border-red-300 ring-1 ring-red-200" : "border-slate-200/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`p-2 rounded-xl bg-white shadow-2xs ${colorBase} shrink-0`}>
                            {isEmergency ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <Wrench className="w-4 h-4 text-indigo-600" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-slate-900 truncate">{c.department}</h4>
                              {isEmergency && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                                  Emergency
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-semibold text-slate-700 truncate mt-0.5">
                              {c.contactPerson} {c.designation ? <span className="text-[10px] text-slate-500 font-normal">({c.designation})</span> : null}
                            </p>
                            {(c.availability || c.locationOrDesk) && (
                              <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400 mt-0.5">
                                {c.availability && (() => {
                                  const status = parseAvailabilityStatus(c.availability);
                                  return (
                                    <span className="flex items-center gap-1">
                                      {status === "open" && (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                          Open Now
                                        </span>
                                      )}
                                      {status === "closed" && (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                                          Closed
                                        </span>
                                      )}
                                      {status === "unknown" && <span>🕒</span>}
                                      <span className="text-slate-400">{c.availability}</span>
                                    </span>
                                  );
                                })()}
                                {c.locationOrDesk && <span>📍 {c.locationOrDesk}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                        {c.phoneNumber && (
                          <button
                            type="button"
                            onClick={() => handlePhoneClick(c.contactPerson, c.phoneNumber)}
                            className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Call</span>
                          </button>
                        )}
                        {c.userId && (
                          <button
                            type="button"
                            onClick={() => openFloatingChatWithUser(String(c.userId))}
                            className="py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Chat</span>
                          </button>
                        )}
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60 transition-all shrink-0 flex items-center justify-center cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={gridClass}>
                {contactMap.map(({ issue, icon, color, leader }) => {
                  if (!leader) return null;
                  const [colorBase] = color.split(" ");
                  return (
                    <div
                      key={issue}
                      className={`p-3.5 rounded-2xl border transition-all bg-white shadow-2xs hover:shadow-sm ${color}`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`p-2 rounded-xl bg-white shadow-2xs ${colorBase} shrink-0`}>
                            {icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{issue}</h4>
                            <p className="text-[11px] font-semibold text-slate-700 truncate mt-0.5">
                              {leader.fullName} <span className="text-[10px] text-slate-500 font-normal">({leader.designation})</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                        {leader.contactPhone && (
                          <button
                            type="button"
                            onClick={() => handlePhoneClick(leader.fullName, leader.contactPhone!)}
                            className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Call</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openFloatingChatWithUser(String(leader.userId))}
                          className="py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Chat</span>
                        </button>
                        {leader.contactEmail && (
                          <a
                            href={`mailto:${leader.contactEmail}`}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60 transition-all shrink-0 flex items-center justify-center cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL: COUNCIL HISTORY & PAST TERMS ── */}
      {showCouncilHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <span>Council History &amp; Past Terms</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chronological record of leadership appointments, designations &amp; tenures.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCouncilHistoryModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingCouncilHistory ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-600" />
                <span className="text-xs font-semibold">Loading leadership history...</span>
              </div>
            ) : councilHistoryLogs.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs font-semibold space-y-2">
                <Award className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No historical council records available yet.</p>
                <p className="text-[11px] text-slate-400 font-normal">
                  All appointments, promotions, and changes to the executive council are logged here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {councilHistoryLogs.map((h, i) => {
                  const badgeColor =
                    h.action === "APPOINTED" || h.action === "CREATED"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : h.action === "UPDATED"
                      ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                      : h.action === "REMOVED"
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : "bg-amber-100 text-amber-800 border-amber-200";

                  return (
                    <div key={h.id || i} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                          {h.action}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(h.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900">{h.fullName}</span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {h.designation}
                        </span>
                        {h.committee && (
                          <span className="text-xs text-slate-500 font-medium">({h.committee})</span>
                        )}
                      </div>

                      {h.changeSummary && (
                        <p className="text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 font-medium">
                          {h.changeSummary}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // If used as modal, render content directly
  if (isModal) {
    return content;
  }

  // Sidebar widget format with accordion toggle
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-xs text-white">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Community Directory</h3>
            <p className="text-[11px] text-slate-500 font-medium">Leadership, committees & contacts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(hasFetched ? leaders.length > 0 : (badgeCount !== undefined ? badgeCount > 0 : leaders.length > 0)) && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {hasFetched ? leaders.length : (badgeCount ?? leaders.length)}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2.5 text-slate-400 py-6">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span className="text-xs font-semibold text-slate-600">Loading community directory...</span>
            </div>
          ) : error || (leaders.length === 0 && whoToCallDbList.length === 0) ? (
            <div className="p-4 text-center">
              <Users className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700">No directory records found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Leadership and committee members will appear here once added.</p>
            </div>
          ) : (
            content
          )}
        </div>
      )}
    </div>
  );
}
