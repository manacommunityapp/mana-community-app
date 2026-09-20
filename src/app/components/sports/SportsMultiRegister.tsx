import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Loader2, ArrowLeft, CheckCircle2, Trophy,
  Calendar, Sparkles, Check, AlertCircle,
  Users, User, MapPin, ShieldCheck, ListChecks, Info, AlertTriangle,
  ArrowUpRight, UserCheck, Plus, X, UserPlus, ChevronDown, ChevronUp, Edit3, Pencil, Crown
} from "lucide-react";
import { toast } from "sonner";
import { sportsService } from "../../../services/sports/sportsService";
import { sportsDashboardService, type DashboardTournamentCard } from "../../../services/sports/sportsDashboardService";
import { auctionService } from "../../../services/sports/auctionService";
import { isTeamSport } from "./utils/sportsConstants";
import { SportsPartnerSelector, type SelectedPartnerInfo } from "./SportsPartnerSelector";
import { familyService, type FamilyMember } from "../../../services/common/familyService";
import { userService } from "../../../services/common/userService";
import { useAuth } from "../../../contexts/AuthContext";
import { DatePicker } from "../ui/date-picker";
import { format } from "date-fns";
import { isValidEmail, isValidIndianPhone } from "./sportsValidation";
import type { PlayerCategory } from "../../../types/api";

// ─── Sport Configs & Metadata ───────────────────────────────────────────────

interface CategoryOption {
  value: string;
  label: string;
  roles: string[];
}

interface SportConfig {
  categories: CategoryOption[];
}

function detectSport(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("cricket")) return "cricket";
  if (n.includes("football") || n.includes("soccer")) return "football";
  if (n.includes("volleyball")) return "volleyball";
  if (n.includes("basketball")) return "basketball";
  if (n.includes("badminton")) return "badminton";
  if (n.includes("kabaddi")) return "kabaddi";
  if (n.includes("hockey")) return "hockey";
  if (n.includes("throwball")) return "throwball";
  if (n.includes("table tennis") || n.includes("tt")) return "table tennis";
  if (n.includes("tennis")) return "tennis";
  if (n.includes("chess")) return "chess";
  if (n.includes("carrom")) return "carrom";
  return "generic";
}

function getSportMeta(sportName: string) {
  const n = (sportName || "").toLowerCase();
  if (n.includes("cricket")) return { emoji: "🏏", bg: "bg-amber-50 text-amber-700 border-amber-200" };
  if (n.includes("football") || n.includes("soccer")) return { emoji: "⚽", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (n.includes("badminton")) return { emoji: "🏸", bg: "bg-blue-50 text-blue-700 border-blue-200" };
  if (n.includes("volleyball")) return { emoji: "🏐", bg: "bg-purple-50 text-purple-700 border-purple-200" };
  if (n.includes("basketball")) return { emoji: "🏀", bg: "bg-orange-50 text-orange-700 border-orange-200" };
  if (n.includes("kabaddi")) return { emoji: "🤼", bg: "bg-rose-50 text-rose-700 border-rose-200" };
  if (n.includes("hockey")) return { emoji: "🏑", bg: "bg-teal-50 text-teal-700 border-teal-200" };
  if (n.includes("throwball")) return { emoji: "🏐", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  if (n.includes("table tennis") || n.includes("tt")) return { emoji: "🏓", bg: "bg-pink-50 text-pink-700 border-pink-200" };
  if (n.includes("tennis")) return { emoji: "🎾", bg: "bg-lime-50 text-lime-700 border-lime-200" };
  if (n.includes("chess")) return { emoji: "♟️", bg: "bg-slate-100 text-slate-700 border-slate-300" };
  if (n.includes("carrom")) return { emoji: "🎯", bg: "bg-amber-50 text-amber-800 border-amber-200" };
  return { emoji: "🏆", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
}

function calculateAge(dobString: string): number | null {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

// ─── Eligibility Validator ──────────────────────────────────────────────────

interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  badgeText?: string;
}

function checkCategoryEligibility(
  cat: PlayerCategory | undefined,
  age: number | null,
  gender: string
): EligibilityResult {
  // If DOB or Gender is missing, registration is disabled until provided
  if (age === null || !gender || !gender.trim()) {
    const missing: string[] = [];
    if (!gender || !gender.trim()) missing.push("Gender");
    if (age === null) missing.push("Date of Birth");
    return {
      eligible: false,
      reason: `${missing.join(" & ")} required to verify sports eligibility.`,
      badgeText: `Missing ${missing.join(" & ")}`,
    };
  }

  if (!cat) return { eligible: true };

  // Age validation
  if (cat.minAge != null && age < cat.minAge) {
    return {
      eligible: false,
      reason: `Age ${age} yrs is below min required age (${cat.minAge} yrs). Allowed: ${cat.minAge}–${cat.maxAge ?? 99} yrs.`,
      badgeText: `Ineligible: Min age ${cat.minAge} yrs`,
    };
  }
  if (cat.maxAge != null && age > cat.maxAge) {
    return {
      eligible: false,
      reason: `Age ${age} yrs exceeds max allowed age (${cat.maxAge} yrs). Allowed: ${cat.minAge ?? 0}–${cat.maxAge} yrs.`,
      badgeText: `Ineligible: Max age ${cat.maxAge} yrs`,
    };
  }

  // Gender validation
  if (cat.gender && cat.gender.toUpperCase() !== "ALL") {
    const userG = gender.trim().toUpperCase();
    const catG = cat.gender.trim().toUpperCase();
    if (catG === "MALE" && userG !== "MALE") {
      return {
        eligible: false,
        reason: `Category is reserved for Male participants only (Selected: ${gender}).`,
        badgeText: `Ineligible: Male only`,
      };
    }
    if (catG === "FEMALE" && userG !== "FEMALE") {
      return {
        eligible: false,
        reason: `Category is reserved for Female participants only (Selected: ${gender}).`,
        badgeText: `Ineligible: Female only`,
      };
    }
  }

  return {
    eligible: true,
    badgeText: `Eligible (Age ${cat.minAge ?? 0}–${cat.maxAge ?? 99} yrs, ${cat.gender || "All"})`,
  };
}

function getEventCategories(
  categories: PlayerCategory[],
  sportName: string,
  eventName?: string,
  eventCategoryName?: string
): PlayerCategory[] {
  if (!categories || categories.length === 0) return [];

  // 1. Direct match by event's configured categoryName from backend/service
  if (eventCategoryName) {
    const direct = categories.filter(
      c => c.name.trim().toLowerCase() === eventCategoryName.trim().toLowerCase()
    );
    if (direct.length > 0) return [direct[0]];
  }

  const eName = (eventName || "").toLowerCase();
  const sportKey = detectSport(sportName || eventName || "").toLowerCase();

  // 2. Check if event name directly mentions a specific category name (e.g. "Under 18", "Above 18", "Men's Singles", "Kids", "Open")
  // Sort categories by name length descending so specific names like "Under 18" match before shorter sub-tokens
  const sortedCats = [...categories].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));
  for (const cat of sortedCats) {
    const cName = (cat.name || "").toLowerCase().trim();
    if (cName && (eName.includes(cName) || (cName.length > 3 && cName.split(" ").every(w => eName.includes(w))))) {
      return [cat];
    }
  }

  // 3. Keyword-based age bracket matching from event title
  const ageKeywords = [
    { key: "under 18", match: (c: string) => c.includes("under 18") || c.includes("u-18") || c.includes("u18") || c.includes("below 18") },
    { key: "u-18", match: (c: string) => c.includes("under 18") || c.includes("u-18") || c.includes("u18") },
    { key: "u18", match: (c: string) => c.includes("under 18") || c.includes("u-18") || c.includes("u18") },
    { key: "above 18", match: (c: string) => c.includes("above 18") || c.includes("18+") || c.includes("adult") || c.includes("senior") },
    { key: "18+", match: (c: string) => c.includes("above 18") || c.includes("18+") || c.includes("adult") },
    { key: "under 14", match: (c: string) => c.includes("under 14") || c.includes("u-14") || c.includes("u14") },
    { key: "u-14", match: (c: string) => c.includes("under 14") || c.includes("u-14") || c.includes("u14") },
    { key: "u14", match: (c: string) => c.includes("under 14") || c.includes("u-14") || c.includes("u14") },
    { key: "under 12", match: (c: string) => c.includes("under 12") || c.includes("u-12") || c.includes("u12") || c.includes("kid") },
    { key: "u-12", match: (c: string) => c.includes("under 12") || c.includes("u-12") || c.includes("u12") },
    { key: "u12", match: (c: string) => c.includes("under 12") || c.includes("u-12") || c.includes("u12") },
    { key: "kids", match: (c: string) => c.includes("kid") || c.includes("under 12") || c.includes("u-12") },
    { key: "senior", match: (c: string) => c.includes("senior") || c.includes("55+") || c.includes("above") },
    { key: "mens", match: (c: string) => c.includes("men") || c.includes("male") },
    { key: "womens", match: (c: string) => c.includes("women") || c.includes("female") },
    { key: "open", match: (c: string) => c.includes("open") || c.includes("general") },
  ];

  for (const { key, match } of ageKeywords) {
    if (eName.includes(key)) {
      const matched = categories.filter(c => match((c.name || "").toLowerCase()));
      if (matched.length > 0) return [matched[0]];
    }
  }

  // 4. Sport-specific category (categories that specifically mention this sport)
  const sportSpecific = categories.filter(c => {
    const cName = (c.name || "").toLowerCase();
    const cDesc = (c.description || "").toLowerCase();
    return cName.includes(sportKey) || cDesc.includes(sportKey);
  });
  if (sportSpecific.length > 0) {
    return [sportSpecific[0]];
  }

  // 5. Exclude categories belonging to other sports
  const ALL_OTHER_SPORTS = [
    "cricket", "football", "soccer", "volleyball", "basketball",
    "badminton", "kabaddi", "hockey", "throwball", "table tennis",
    "tennis", "chess", "carrom", "swimming", "pickleball", "padel", "squash"
  ].filter(s => s !== sportKey && !sportKey.includes(s) && !s.includes(sportKey));

  const nonOther = categories.filter(c => {
    const cName = (c.name || "").toLowerCase();
    const cDesc = (c.description || "").toLowerCase();
    return !ALL_OTHER_SPORTS.some(other => cName.includes(other) || cDesc.includes(other));
  });

  return nonOther.length > 0 ? [nonOther[0]] : categories.slice(0, 1);
}

function findBestEligibleCategory(
  categories: PlayerCategory[],
  sportName: string,
  age: number | null,
  gender: string,
  eventName?: string,
  eventCategoryName?: string
): PlayerCategory | undefined {
  if (!categories || categories.length === 0) return undefined;
  const eventPool = getEventCategories(categories, sportName, eventName, eventCategoryName);
  if (eventPool.length === 1) {
    return eventPool[0];
  }
  const eligible = eventPool.find(c => checkCategoryEligibility(c, age, gender).eligible);
  return eligible || eventPool[0];
}

const SPORT_CONFIGS: Record<string, SportConfig> = {
  cricket: {
    categories: [
      { value: "BATSMEN", label: "Batsmen", roles: ["Right Hand Batsman", "Left Hand Batsman"] },
      { value: "BOWLERS", label: "Bowlers", roles: ["Right Arm Fast", "Right Arm Medium", "Right Arm Spin", "Left Arm Fast", "Left Arm Spin"] },
      { value: "ALL_ROUNDERS", label: "All-Rounders", roles: ["Batting All-Rounder", "Bowling All-Rounder"] },
      { value: "WICKET_KEEPERS", label: "Wicket-Keepers", roles: ["Wicketkeeper Batsman"] },
    ],
  },
  football: {
    categories: [
      { value: "GOALKEEPER", label: "Goalkeeper", roles: ["Goalkeeper"] },
      { value: "DEFENDER", label: "Defender", roles: ["Center Back", "Full Back", "Wing Back"] },
      { value: "MIDFIELDER", label: "Midfielder", roles: ["Central Midfielder", "Attacking Midfielder", "Defensive Midfielder"] },
      { value: "FORWARD", label: "Forward", roles: ["Striker", "Winger"] },
    ],
  },
  badminton: {
    categories: [
      { value: "SINGLES", label: "Singles", roles: ["Men's Singles", "Women's Singles", "Singles Player"] },
      { value: "DOUBLES", label: "Doubles", roles: ["Men's Doubles", "Women's Doubles", "Doubles Partner"] },
      { value: "MIXED_DOUBLES", label: "Mixed Doubles", roles: ["Mixed Doubles Partner"] },
    ],
  },
  tennis: {
    categories: [
      { value: "SINGLES", label: "Singles", roles: ["Men's Singles", "Women's Singles", "Singles Player"] },
      { value: "DOUBLES", label: "Doubles", roles: ["Men's Doubles", "Women's Doubles", "Doubles Partner"] },
      { value: "MIXED_DOUBLES", label: "Mixed Doubles", roles: ["Mixed Doubles Partner"] },
    ],
  },
  "table tennis": {
    categories: [
      { value: "SINGLES", label: "Singles", roles: ["Men's Singles", "Women's Singles", "Singles Player"] },
      { value: "DOUBLES", label: "Doubles", roles: ["Men's Doubles", "Women's Doubles", "Doubles Partner"] },
      { value: "MIXED_DOUBLES", label: "Mixed Doubles", roles: ["Mixed Doubles Partner"] },
    ],
  },
  pickleball: {
    categories: [
      { value: "SINGLES", label: "Singles", roles: ["Men's Singles", "Women's Singles", "Singles Player"] },
      { value: "DOUBLES", label: "Doubles", roles: ["Men's Doubles", "Women's Doubles", "Doubles Partner"] },
      { value: "MIXED_DOUBLES", label: "Mixed Doubles", roles: ["Mixed Doubles Partner"] },
    ],
  },
  squash: {
    categories: [
      { value: "SINGLES", label: "Singles", roles: ["Men's Singles", "Women's Singles", "Singles Player"] },
      { value: "DOUBLES", label: "Doubles", roles: ["Doubles Partner"] },
    ],
  },
  padel: {
    categories: [
      { value: "DOUBLES", label: "Doubles", roles: ["Doubles Partner"] },
      { value: "SINGLES", label: "Singles", roles: ["Singles Player"] },
    ],
  },
  carrom: {
    categories: [
      { value: "SINGLES", label: "Singles", roles: ["Singles Player", "Player"] },
      { value: "DOUBLES", label: "Doubles", roles: ["Doubles Partner", "Partner"] },
    ],
  },
  chess: {
    categories: [
      { value: "INDIVIDUAL", label: "Individual", roles: ["Player"] },
    ],
  },
  volleyball: {
    categories: [
      { value: "OUTSIDE_HITTER", label: "Outside Hitter", roles: ["Outside Hitter"] },
      { value: "MIDDLE_BLOCKER", label: "Middle Blocker", roles: ["Middle Blocker"] },
      { value: "SETTER", label: "Setter", roles: ["Setter"] },
      { value: "LIBERO", label: "Libero", roles: ["Libero"] },
      { value: "OPPOSITE_HITTER", label: "Opposite Hitter", roles: ["Opposite Hitter"] },
    ],
  },
  basketball: {
    categories: [
      { value: "POINT_GUARD", label: "Point Guard", roles: ["Point Guard"] },
      { value: "SHOOTING_GUARD", label: "Shooting Guard", roles: ["Shooting Guard"] },
      { value: "SMALL_FORWARD", label: "Small Forward", roles: ["Small Forward"] },
      { value: "POWER_FORWARD", label: "Power Forward", roles: ["Power Forward"] },
      { value: "CENTER", label: "Center", roles: ["Center"] },
    ],
  },
  kabaddi: {
    categories: [
      { value: "RAIDER", label: "Raider", roles: ["Main Raider", "Support Raider"] },
      { value: "DEFENDER", label: "Defender", roles: ["Left Corner", "Right Corner", "Cover"] },
      { value: "ALL_ROUNDER", label: "All-Rounder", roles: ["All-Rounder"] },
    ],
  },
  hockey: {
    categories: [
      { value: "GOALKEEPER", label: "Goalkeeper", roles: ["Goalkeeper"] },
      { value: "DEFENDER", label: "Defender", roles: ["Full Back", "Half Back"] },
      { value: "MIDFIELDER", label: "Midfielder", roles: ["Center Half", "Winger"] },
      { value: "FORWARD", label: "Forward", roles: ["Center Forward", "Striker"] },
    ],
  },
  throwball: {
    categories: [
      { value: "THROWER", label: "Thrower", roles: ["Lead Thrower", "Support Thrower"] },
      { value: "CATCHER", label: "Catcher", roles: ["Lead Catcher", "Support Catcher"] },
      { value: "UNIVERSAL", label: "Universal", roles: ["Universal Player"] },
    ],
  },
  generic: {
    categories: [
      { value: "PLAYER", label: "Player", roles: ["Standard Player", "Captain", "Vice Captain"] },
    ],
  },
};

function normalizeFormatList(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(s => {
      if (typeof s === "object" && s !== null) {
        return String(s.name || s.format || s.value || s.type || "").trim().toUpperCase().replace(/\s+/g, "_");
      }
      return String(s).trim().toUpperCase().replace(/\s+/g, "_");
    }).filter(Boolean);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(s => {
            if (typeof s === "object" && s !== null) {
              return String(s.name || s.format || s.value || s.type || "").trim().toUpperCase().replace(/\s+/g, "_");
            }
            return String(s).trim().toUpperCase().replace(/\s+/g, "_");
          }).filter(Boolean);
        }
      } catch {}
    }
    return trimmed.split(",").map(s => s.trim().toUpperCase().replace(/\s+/g, "_")).filter(Boolean);
  }
  return [];
}

function getAvailableEventFormats(
  ev: any,
  sportName: string,
  eventName: string,
  tournamentName?: string,
  metaList: any[] = []
): string[] {
  const eName = (eventName || "").toLowerCase();
  const tName = (tournamentName || "").toLowerCase();
  const sName = (sportName || "").toLowerCase();
  const combined = `${sName} ${tName} ${eName} ${(ev?.name || "").toLowerCase()}`;
  const sKey = detectSport(combined);

  // 1. Check if event or tournament explicitly specifies formats
  const rawExplicit =
    ev?.formats ||
    ev?.format ||
    ev?.matchFormat ||
    ev?.matchFormats ||
    ev?.matchTypes ||
    ev?.sport?.formats ||
    ev?.sport?.format ||
    (ev as any)?.tournament?.format ||
    (ev as any)?.tournament?.formats;

  const parsedExplicit = normalizeFormatList(rawExplicit);
  if (parsedExplicit.length > 0) {
    // If explicit formats are specified (e.g. ["SINGLES", "DOUBLES"]), respect them directly!
    // Only restrict if the event name specifically targets ONLY a single sub-bracket (e.g. purely "Mixed Doubles")
    if ((eName.includes("mixed") || eName.includes("mixed doubles")) && parsedExplicit.length === 1 && parsedExplicit.includes("MIXED_DOUBLES")) {
      return ["MIXED_DOUBLES"];
    }
    return parsedExplicit;
  }

  // 2. Formats from sports metadata
  const meta = metaList.find((m: any) => m.name && (
    m.name.toLowerCase() === sName ||
    eName.includes(m.name.toLowerCase()) ||
    tName.includes(m.name.toLowerCase()) ||
    sName.includes(m.name.toLowerCase())
  ));
  if (meta?.formats) {
    const metaFormats = normalizeFormatList(meta.formats);
    if (metaFormats.length > 0) {
      return metaFormats;
    }
  }

  // 3. Check event name keywords if it explicitly says Singles & Doubles
  if (eName.includes("singles") && eName.includes("doubles")) {
    return eName.includes("mixed") ? ["SINGLES", "DOUBLES", "MIXED_DOUBLES"] : ["SINGLES", "DOUBLES"];
  }
  if (eName.includes("mixed") || eName.includes("mixed doubles")) {
    return ["MIXED_DOUBLES"];
  }
  if (eName.includes("doubles") && !eName.includes("singles")) {
    return ["DOUBLES"];
  }

  // 4. Default available formats based on sport type (racket/court/table sports support singles & doubles)
  if (
    ["badminton", "table tennis", "tennis", "pickleball"].includes(sKey) ||
    combined.includes("badminton") ||
    combined.includes("tennis") ||
    combined.includes("table tennis") ||
    combined.includes("pickleball") ||
    combined.includes("shuttle") ||
    combined.includes("tt")
  ) {
    return ["SINGLES", "DOUBLES", "MIXED_DOUBLES"];
  }

  if (
    ["squash", "padel", "carrom"].includes(sKey) ||
    combined.includes("squash") ||
    combined.includes("padel") ||
    combined.includes("carrom")
  ) {
    return ["SINGLES", "DOUBLES"];
  }

  if (
    ["swimming", "athletics"].includes(sKey) ||
    combined.includes("swimming") ||
    combined.includes("athletics") ||
    combined.includes("track")
  ) {
    return ["INDIVIDUAL", "RELAY"];
  }

  return ["SINGLES", "DOUBLES"];
}

interface SportEventSelection {
  eventId: number;
  uuid?: string;
  name: string;
  sportName: string;
  categoryName?: string;
  venueName?: string;
  eventDateStart?: string;
  eventDateEnd?: string;
  isRegistered?: boolean;
  selected: boolean;
  matchType: string;
  matchTypes?: string[];
  availableFormats?: string[];
  role: string;
  categoryId?: number;
  partnerUserId?: number | null;
  partnerInfo?: SelectedPartnerInfo | null;
  captainNomination?: boolean;
  proposedTeamName?: string;
}

export function SportsMultiRegister() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tournament, setTournament] = useState<DashboardTournamentCard | null>(null);
  const [categories, setCategories] = useState<PlayerCategory[]>([]);
  const [eventSelections, setEventSelections] = useState<SportEventSelection[]>([]);

  // User / Registrant details
  const [liveUser, setLiveUser] = useState<any>(user);
  const [regType, setRegType] = useState<"self" | "family">("self");
  const [playerName, setPlayerName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [gender, setGender] = useState((user as any)?.gender || "");
  const [dateOfBirth, setDateOfBirth] = useState((user as any)?.dateOfBirth || (user as any)?.dob || "");
  const [relation, setRelation] = useState("");
  const [flatNumber, setFlatNumber] = useState((user as any)?.flatNo || (user as any)?.flatNumber || (user as any)?.unitNumber || "");
  const [familyMemberId, setFamilyMemberId] = useState<number | string | undefined>();
  const [savedFamilyMembers, setSavedFamilyMembers] = useState<FamilyMember[]>([]);

  const userProfileName = liveUser?.fullName || user?.fullName || "";
  const userProfileGender = liveUser?.gender || (user as any)?.gender || "";
  const userProfileDob = liveUser?.dateOfBirth || (liveUser as any)?.dob || (user as any)?.dateOfBirth || (user as any)?.dob || "";
  
  const userBlock = liveUser?.block || (liveUser as any)?.tower || user?.block || (user as any)?.tower || "";
  const rawUserFlat = liveUser?.flatNo || (liveUser as any)?.flatNumber || (liveUser as any)?.unitNumber || user?.flatNo || (user as any)?.flatNumber || (user as any)?.unitNumber || "";

  const userProfileFlat = useMemo(() => {
    const b = userBlock?.trim() || "";
    const f = rawUserFlat?.trim() || "";
    if (b && f) {
      if (f.toUpperCase().startsWith(b.toUpperCase()) || f.toUpperCase().includes(b.toUpperCase())) {
        return f;
      }
      return `Block ${b}, Flat ${f}`;
    }
    if (f) return f;
    if (b) return `Block ${b}`;
    return "";
  }, [userBlock, rawUserFlat]);

  const missingProfileFields = useMemo(() => {
    const missing: string[] = [];
    if (!userProfileName?.trim()) missing.push("Full Name");
    if (!userProfileGender?.trim()) missing.push("Gender");
    if (!userProfileDob?.trim()) missing.push("Date of Birth");
    if (!userProfileFlat?.trim()) missing.push("Block & Flat");
    return missing;
  }, [userProfileName, userProfileGender, userProfileDob, userProfileFlat]);

  const familyMembersOnly = useMemo(() => {
    return savedFamilyMembers.filter((m) => {
      const rel = (m.relation || (m as any).relationship || "").toUpperCase().trim();
      const isSelf =
        rel === "SELF" ||
        rel === "HEAD" ||
        m.id === "self" ||
        m.id === "member-self" ||
        (user?.fullName && m.name?.trim().toLowerCase() === user.fullName.trim().toLowerCase());
      return !isSelf;
    });
  }, [savedFamilyMembers, user?.fullName]);

  // Unified Edit / Add Details Modal State (Self or Family Member)
  const [profileModalState, setProfileModalState] = useState<{
    open: boolean;
    mode: "self" | "family_edit" | "family_add";
    memberId?: number | string;
    name: string;
    relation: string;
    gender: string;
    dob: string;
    phone: string;
    flatNo?: string;
    gotram?: string;
    bloodGroup?: string;
  }>({
    open: false,
    mode: "self",
    name: "",
    relation: "Son",
    gender: "Male",
    dob: "",
    phone: "",
    flatNo: "",
    gotram: "",
    bloodGroup: "",
  });

  const [savingProfileModal, setSavingProfileModal] = useState(false);

  const openUpdateDetailsModal = (mode: "self" | "family_edit" | "family_add", targetMemberId?: number | string) => {
    if (mode === "self") {
      setProfileModalState({
        open: true,
        mode: "self",
        name: playerName || userProfileName || user?.fullName || "",
        relation: "SELF",
        gender: gender || userProfileGender || "",
        dob: dateOfBirth || userProfileDob || "",
        phone: liveUser?.phone || user?.phone || "",
        flatNo: flatNumber || userProfileFlat || "",
        gotram: "",
        bloodGroup: "",
      });
    } else if (mode === "family_edit") {
      const targetId = targetMemberId || familyMemberId;
      const mem = familyMembersOnly.find(m => String(m.id) === String(targetId)) || familyMembersOnly[0];
      if (mem) {
        setProfileModalState({
          open: true,
          mode: "family_edit",
          memberId: mem.id,
          name: mem.name || "",
          relation: mem.relation || (mem as any).relationship || "Son",
          gender: mem.gender || "",
          dob: mem.dob || (mem as any).dateOfBirth || "",
          phone: mem.phone || "",
          flatNo: userProfileFlat,
          gotram: mem.gotram || "",
          bloodGroup: mem.bloodGroup || "",
        });
      } else {
        openUpdateDetailsModal("family_add");
      }
    } else {
      setProfileModalState({
        open: true,
        mode: "family_add",
        name: "",
        relation: "Son",
        gender: "Male",
        dob: "",
        phone: "",
        flatNo: userProfileFlat,
        gotram: "",
        bloodGroup: "",
      });
    }
  };

  const handleProfileModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileModalState.name.trim()) {
      toast.error("Please enter full name");
      return;
    }
    if (!profileModalState.gender) {
      toast.error("Please select a gender");
      return;
    }
    if (!profileModalState.dob) {
      toast.error("Please select Date of Birth");
      return;
    }
    if (profileModalState.phone?.trim() && !isValidIndianPhone(profileModalState.phone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    setSavingProfileModal(true);
    try {
      const computedAge = calculateAge(profileModalState.dob) || 18;

      if (profileModalState.mode === "self") {
        if (user?.userId) {
          try {
            await userService.updateUser(Number(user.userId), {
              gender: profileModalState.gender,
              dateOfBirth: profileModalState.dob,
              fullName: profileModalState.name.trim(),
              flatNo: profileModalState.flatNo?.trim() || undefined,
            });
          } catch (apiErr) {
            console.warn("Could not save to userService.updateUser directly, fallback to context sync:", apiErr);
          }
        }
        updateUser({
          gender: profileModalState.gender,
          dateOfBirth: profileModalState.dob,
          fullName: profileModalState.name.trim(),
          flatNo: profileModalState.flatNo?.trim(),
        });
        familyService.syncUserProfile(
          profileModalState.name.trim(),
          profileModalState.dob,
          profileModalState.gender,
          profileModalState.phone?.trim() || user?.phone,
          user?.email
        );
        setPlayerName(profileModalState.name.trim());
        setGender(profileModalState.gender);
        setDateOfBirth(profileModalState.dob);
        if (profileModalState.flatNo) setFlatNumber(profileModalState.flatNo.trim());
        setFormErrors({});
        setEventErrors({});
        toast.success("Profile details updated successfully!");
      } else if (profileModalState.mode === "family_edit") {
        const payload = {
          name: profileModalState.name.trim(),
          relation: profileModalState.relation,
          dob: profileModalState.dob,
          gender: profileModalState.gender,
          phone: profileModalState.phone?.trim() || undefined,
          gotram: profileModalState.gotram?.trim() || undefined,
          bloodGroup: profileModalState.bloodGroup?.trim() || undefined,
          age: computedAge,
          status: "ACTIVE",
        };
        await familyService.updateFamilyMember(Number(profileModalState.memberId), payload);
        const refreshed = await familyService.getFamilyMembers(true);
        setSavedFamilyMembers(refreshed);
        setPlayerName(payload.name);
        setGender(payload.gender);
        setDateOfBirth(payload.dob);
        setRelation(payload.relation);
        setFormErrors({});
        setEventErrors({});
        toast.success(`Family member "${payload.name}" updated successfully!`);
      } else {
        const payload = {
          name: profileModalState.name.trim(),
          relation: profileModalState.relation,
          dob: profileModalState.dob,
          gender: profileModalState.gender,
          phone: profileModalState.phone?.trim() || undefined,
          gotram: profileModalState.gotram?.trim() || undefined,
          bloodGroup: profileModalState.bloodGroup?.trim() || undefined,
          age: computedAge,
          status: "ACTIVE",
        };
        const saved = await familyService.addFamilyMember(payload);
        const refreshed = await familyService.getFamilyMembers(true);
        setSavedFamilyMembers(refreshed);
        setPlayerName(payload.name);
        setFamilyMemberId(saved.id);
        setGender(payload.gender);
        setDateOfBirth(payload.dob);
        setRelation(payload.relation);
        setFormErrors({});
        setEventErrors({});
        toast.success(`Family member "${payload.name}" added successfully!`);
      }

      setProfileModalState(prev => ({ ...prev, open: false }));
    } catch (err: any) {
      toast.error(err?.message || "Failed to update details");
    } finally {
      setSavingProfileModal(false);
    }
  };

  // Validation errors
  const [formErrors, setFormErrors] = useState<{ playerName?: string; gender?: string; dateOfBirth?: string }>({});
  const [eventErrors, setEventErrors] = useState<Record<number, string>>({});
  // Accordion toggle state for sport groups: true means open (expanded by default)
  const [expandedSports, setExpandedSports] = useState<Record<string, boolean>>({});

  // Inline Mobile Dropdown Picker state (full width within parent div)
  const [openInlinePicker, setOpenInlinePicker] = useState<{
    eventId: number;
    type: "role" | "category";
  } | null>(null);

  const toggleInlinePicker = (eventId: number, type: "role" | "category") => {
    setOpenInlinePicker(prev =>
      prev?.eventId === eventId && prev?.type === type ? null : { eventId, type }
    );
  };

  const toggleSportCollapse = (sportName: string) => {
    setExpandedSports(prev => ({
      ...prev,
      [sportName]: prev[sportName] === false ? true : false,
    }));
  };

  const currentAge = useMemo(() => calculateAge(dateOfBirth), [dateOfBirth]);

  // Load user profile & family members
  useEffect(() => {
    userService.getMe().then((me) => {
      setLiveUser(me);
      const userGenderVal = me.gender || "";
      const userDobVal = me.dateOfBirth || (me as any).dob || "";
      const userFlatVal = me.flatNo || (me as any).flatNumber || (me as any).unitNumber || "";
      const userNameVal = me.fullName || "";

      if (me.gender || me.dateOfBirth || userFlatVal) {
        updateUser({
          gender: me.gender,
          dateOfBirth: me.dateOfBirth || (me as any).dob,
        });
      }

      if (regType === "self") {
        if (userNameVal) setPlayerName(userNameVal);
        if (userGenderVal) setGender(userGenderVal);
        if (userDobVal) setDateOfBirth(userDobVal);
        if (userFlatVal) setFlatNumber(userFlatVal);
        if (me.email) setEmail(me.email);
      }
    }).catch((err) => {
      console.warn("Could not fetch latest user profile:", err);
    });

    familyService.getFamilyMembers().then(setSavedFamilyMembers).catch(() => {});

    const handleFamilyUpdated = (e: any) => {
      if (Array.isArray(e.detail)) {
        setSavedFamilyMembers(e.detail);
      } else {
        familyService.getFamilyMembers(true).then(setSavedFamilyMembers).catch(() => {});
      }
    };
    window.addEventListener("mana_family_updated", handleFamilyUpdated);
    return () => window.removeEventListener("mana_family_updated", handleFamilyUpdated);
  }, [updateUser, regType]);

  // Load tournament, open events, and player categories directly from service repository
  useEffect(() => {
    const fetchTournamentData = async () => {
      setLoading(true);
      try {
        const [openTourneys, cats, metaList, directTourney] = await Promise.all([
          sportsDashboardService.getOpenTournaments().catch(() => [] as DashboardTournamentCard[]),
          sportsService.getCategories().catch(() => [] as PlayerCategory[]),
          sportsService.getSportsMeta().catch(() => [] as any[]),
          tournamentId ? sportsService.getTournamentById(Number(tournamentId)).catch(() => null) : Promise.resolve(null),
        ]);
        setCategories(cats);

        let targetTourney = openTourneys.find(t => String(t.id) === String(tournamentId));

        if (directTourney) {
          const rawTourney = directTourney;
          const childEvents = (rawTourney as any).childEvents || (rawTourney as any).events;
          targetTourney = {
            id: rawTourney.id,
            name: rawTourney.name,
            bannerImage: (rawTourney as any).bannerImage || targetTourney?.bannerImage || null,
            eventDateStart: rawTourney.eventDateStart || targetTourney?.eventDateStart || null,
            eventDateEnd: rawTourney.eventDateEnd || targetTourney?.eventDateEnd || null,
            registrationStatus: rawTourney.registrationStatus || rawTourney.status || targetTourney?.registrationStatus || "REGISTRATION_OPEN",
            communityId: (rawTourney as any).communityId || targetTourney?.communityId || null,
            communityName: (rawTourney as any).community?.name || targetTourney?.communityName || null,
            events: childEvents && childEvents.length > 0
              ? childEvents.map((ce: any) => ({
                  id: ce.id,
                  uuid: ce.uuid || null,
                  name: ce.name,
                  eventDateStart: ce.eventDateStart || null,
                  eventDateEnd: ce.eventDateEnd || null,
                  sportName: ce.sportName || ce.sport?.name || (rawTourney as any).sportName || (rawTourney as any).sport?.name || rawTourney.name || null,
                  categoryName: ce.categoryName || ce.category?.name || null,
                  venueName: ce.venueName || ce.venue?.name || null,
                  maxParticipants: ce.maxParticipants || null,
                  registrationStatus: ce.registrationStatus || ce.status || null,
                  auctionStatus: ce.auctionStatus || null,
                  teamSport: Boolean(ce.teamSport),
                  format: ce.format || ce.formats || (rawTourney as any).format || (rawTourney as any).formats || null,
                  formats: ce.formats || ce.format || (rawTourney as any).formats || (rawTourney as any).format || null,
                  myRegistrationId: ce.myRegistrationId || null,
                  myRegistrationStatus: ce.myRegistrationStatus || null,
                }))
              : targetTourney?.events && targetTourney.events.length > 0
                ? targetTourney.events.map(te => ({
                    ...te,
                    format: (rawTourney as any).format || (rawTourney as any).formats || (te as any).format || (te as any).formats || null,
                    formats: (rawTourney as any).formats || (rawTourney as any).format || (te as any).formats || (te as any).format || null,
                  }))
                : [{
                    id: rawTourney.id,
                    uuid: rawTourney.uuid || null,
                    name: rawTourney.name,
                    eventDateStart: rawTourney.eventDateStart || null,
                    eventDateEnd: rawTourney.eventDateEnd || null,
                    sportName: (rawTourney as any).sportName || (rawTourney as any).sport?.name || rawTourney.name || null,
                    categoryName: (rawTourney as any).categoryName || (rawTourney as any).category?.name || null,
                    venueName: (rawTourney as any).venueName || (rawTourney as any).venue?.name || null,
                    maxParticipants: rawTourney.maxParticipants || null,
                    registrationStatus: rawTourney.registrationStatus || rawTourney.status || null,
                    auctionStatus: (rawTourney as any).auctionStatus || null,
                    teamSport: Boolean((rawTourney as any).teamSport),
                    format: (rawTourney as any).format || (rawTourney as any).formats || null,
                    formats: (rawTourney as any).formats || (rawTourney as any).format || null,
                    myRegistrationId: null,
                    myRegistrationStatus: null,
                  }],
          };
        }

        if (targetTourney) {
          setTournament(targetTourney);
          const initialAge = calculateAge(dateOfBirth);

          const initialSelections: SportEventSelection[] = targetTourney.events.map(ev => {
            const resolvedSportName = ev.sportName || (targetTourney as any).sportName || (targetTourney as any).sport?.name || targetTourney.name || "Sports";
            const sportKey = detectSport(`${resolvedSportName} ${targetTourney.name} ${ev.name}`);
            const cfg = SPORT_CONFIGS[sportKey] || SPORT_CONFIGS.generic;
            const defaultRole = cfg.categories[0]?.roles[0] || "Player";
            const isAlreadyRegistered = Boolean(ev.myRegistrationId);

            // Find single related category from service categories for this specific event
            const matchedCategory = findBestEligibleCategory(cats, resolvedSportName || ev.name, initialAge, gender, ev.name, ev.categoryName || undefined);
            const isEligible = matchedCategory ? checkCategoryEligibility(matchedCategory, initialAge, gender).eligible : false;

            // Detect available participation formats (e.g. Singles, Doubles, Mixed Doubles)
            const availableFormats = getAvailableEventFormats(ev, resolvedSportName, ev.name, targetTourney.name, metaList);
            const defaultFormat = availableFormats[0] || "SINGLES";

            return {
              eventId: ev.id,
              uuid: ev.uuid ?? undefined,
              name: ev.name,
              sportName: resolvedSportName,
              categoryName: ev.categoryName || undefined,
              venueName: ev.venueName || undefined,
              eventDateStart: ev.eventDateStart || undefined,
              eventDateEnd: ev.eventDateEnd || undefined,
              isRegistered: isAlreadyRegistered,
              selected: !isAlreadyRegistered && isEligible, // Pre-select only eligible un-registered events
              matchType: defaultFormat,
              matchTypes: availableFormats.length > 0 ? [defaultFormat] : ["SINGLES"],
              availableFormats: availableFormats,
              role: defaultRole,
              categoryId: matchedCategory?.id,
            };
          });
          setEventSelections(initialSelections);
        } else {
          toast.error("Tournament not found or no longer open for registration");
        }
      } catch (err: any) {
        toast.error("Failed to load tournament events: " + (err?.message || ""));
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  // Auto-adjust categories when age or gender changes to ensure participant is assigned to an eligible category
  useEffect(() => {
    if (categories.length === 0 || eventSelections.length === 0) return;
    const age = calculateAge(dateOfBirth);

    setEventSelections(prev => prev.map(ev => {
      let catId = ev.categoryId;
      const currentCat = categories.find(c => c.id === ev.categoryId);
      let isEligible = checkCategoryEligibility(currentCat, age, gender).eligible;

      // If current category is ineligible or not set, switch to best eligible category for this event
      if (!isEligible) {
        const best = findBestEligibleCategory(categories, ev.sportName || ev.name, age, gender, ev.name, ev.categoryName);
        if (best && best.id !== ev.categoryId) {
          catId = best.id;
          isEligible = checkCategoryEligibility(best, age, gender).eligible;
        }
      }

      // If ineligible or already registered, uncheck it
      const shouldBeSelected = ev.isRegistered ? false : (isEligible ? ev.selected : false);

      return {
        ...ev,
        categoryId: catId,
        selected: shouldBeSelected,
      };
    }));

    // Clear event errors when user updates participant demographic details
    setEventErrors({});
  }, [dateOfBirth, gender, categories]);

  // Handle registrant type switch
  const handleRegTypeChange = (type: "self" | "family") => {
    setRegType(type);
    setFormErrors({});
    setEventErrors({});
    if (type === "self") {
      setPlayerName(userProfileName);
      setEmail(liveUser?.email || user?.email || "");
      setGender(userProfileGender);
      setDateOfBirth(userProfileDob);
      setFlatNumber(userProfileFlat);
      setRelation("");
      setFamilyMemberId(undefined);
    } else {
      setFlatNumber(userProfileFlat);
      if (familyMembersOnly.length > 0) {
        const first = familyMembersOnly[0];
        setPlayerName(first.name);
        setEmail(first.email || "");
        setGender(first.gender || "");
        setDateOfBirth(first.dob || (first as any).dateOfBirth || "");
        setRelation(first.relation || (first as any).relationship || "");
        setFamilyMemberId(first.id);
      } else {
        setPlayerName("");
        setEmail("");
        setGender("");
        setDateOfBirth("");
        setRelation("");
        setFamilyMemberId(undefined);
      }
    }
  };

  const handleFamilyMemberSelect = (memberId: string | number) => {
    const member = familyMembersOnly.find(m => String(m.id) === String(memberId));
    if (member) {
      setPlayerName(member.name);
      setEmail(member.email || "");
      setGender(member.gender || "");
      setDateOfBirth(member.dob || (member as any).dateOfBirth || "");
      setRelation(member.relation || (member as any).relationship || "");
      setFlatNumber(userProfileFlat);
      setFamilyMemberId(member.id);
      setFormErrors({});
      setEventErrors({});
    }
  };

  const toggleEventSelection = (eventId: number) => {
    setEventSelections(prev => prev.map(ev => {
      if (ev.eventId === eventId) {
        if (ev.isRegistered) return ev;
        const eventCats = getEventCategories(categories, ev.sportName || ev.name, ev.name, ev.categoryName);
        const selectedCat = categories.find(c => c.id === ev.categoryId) || eventCats[0];
        const isEligible = checkCategoryEligibility(selectedCat, currentAge, gender).eligible;
        if (!isEligible) {
          return { ...ev, selected: false };
        }
        return { ...ev, selected: !ev.selected };
      }
      return ev;
    }));
    // Clear error on toggle
    setEventErrors(prev => {
      const copy = { ...prev };
      delete copy[eventId];
      return copy;
    });
  };

  const updateEventField = (eventId: number, field: "role" | "matchType" | "categoryId", value: any) => {
    setEventSelections(prev => prev.map(ev => {
      if (ev.eventId === eventId) {
        const updated = { ...ev, [field]: value };
        if (field === "categoryId") {
          const selectedCat = categories.find(c => c.id === value);
          const isEligible = checkCategoryEligibility(selectedCat, currentAge, gender).eligible;
          if (!isEligible) {
            updated.selected = false;
          }
        }
        return updated;
      }
      return ev;
    }));
    // Clear error on field update
    setEventErrors(prev => {
      const copy = { ...prev };
      delete copy[eventId];
      return copy;
    });
  };

  const toggleEventFormat = (eventId: number, formatToToggle: string) => {
    setEventSelections(prev => prev.map(ev => {
      if (ev.eventId === eventId) {
        const current = ev.matchTypes && ev.matchTypes.length > 0 ? ev.matchTypes : [ev.matchType || "SINGLES"];
        const isAlready = current.some(f => f.toUpperCase() === formatToToggle.toUpperCase());
        let nextFormats: string[];
        if (isAlready) {
          if (current.length === 1) {
            toast.error("At least one participant format must be selected");
            return ev;
          }
          nextFormats = current.filter(f => f.toUpperCase() !== formatToToggle.toUpperCase());
        } else {
          nextFormats = [...current, formatToToggle];
        }
        return {
          ...ev,
          matchTypes: nextFormats,
          matchType: nextFormats[0] || formatToToggle,
        };
      }
      return ev;
    }));
  };

  const [registeringEventId, setRegisteringEventId] = useState<number | null>(null);

  // Single Event Direct Registration Handler
  const handleSingleRegister = async (eventId: number) => {
    if (regType === "self" && (!gender || !dateOfBirth)) {
      openUpdateDetailsModal("self");
      toast.error("Please update your Gender and Date of Birth to proceed with registration.");
      return;
    }
    if (regType === "family" && (!gender || !dateOfBirth)) {
      openUpdateDetailsModal(familyMemberId ? "family_edit" : "family_add", familyMemberId);
      toast.error("Please update Gender and Date of Birth for the selected family member.");
      return;
    }

    const errors: { playerName?: string; gender?: string; dateOfBirth?: string } = {};
    if (!playerName.trim()) errors.playerName = "Participant name is required";
    if (!gender) errors.gender = "Gender is required";
    if (!dateOfBirth) errors.dateOfBirth = "Date of birth is mandatory for category validation";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please complete the required participant information first");
      return;
    }
    setFormErrors({});

    const ev = eventSelections.find(e => e.eventId === eventId);
    if (!ev) return;

    const eventCats = getEventCategories(categories, ev.sportName || ev.name, ev.name, ev.categoryName);
    const selectedCategory = categories.find(c => c.id === ev.categoryId) || eventCats[0];
    if (!selectedCategory) {
      setEventErrors(prev => ({ ...prev, [eventId]: "Please select a category bracket" }));
      toast.error("Please select a category bracket for this sport");
      return;
    }

    if (email.trim() && !isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const calculatedAge = currentAge !== null ? currentAge : 25;
    const eligibility = checkCategoryEligibility(selectedCategory, calculatedAge, gender);
    if (!eligibility.eligible) {
      setEventErrors(prev => ({ ...prev, [eventId]: eligibility.reason || "Ineligible for selected category" }));
      toast.error(`Ineligible: ${eligibility.reason}`);
      return;
    }

    setRegisteringEventId(eventId);
    setEventErrors(prev => {
      const copy = { ...prev };
      delete copy[eventId];
      return copy;
    });

    const formatsToRegister = (ev.matchTypes && ev.matchTypes.length > 0) ? ev.matchTypes : [ev.matchType || "SINGLES"];

    try {
      for (const fmt of formatsToRegister) {
        const isDoubles = fmt.toUpperCase().includes("DOUBLES");
        await sportsService.registerForEvent({
          eventId: ev.eventId,
          categoryId: selectedCategory.id,
          matchType: fmt,
          role: ev.role || "Player",
          age: calculatedAge,
          dateOfBirth: dateOfBirth,
          playerName: playerName.trim(),
          email: email.trim() || undefined,
          relation: relation || undefined,
          flatNumber: flatNumber || undefined,
          familyMemberId: regType === "family" && familyMemberId && !isNaN(Number(familyMemberId)) ? Number(familyMemberId) : undefined,
          partnerUserId: isDoubles && ev.partnerUserId ? ev.partnerUserId : undefined,
          captainNomination: ev.captainNomination || undefined,
          proposedTeamName: ev.captainNomination && ev.proposedTeamName ? ev.proposedTeamName.trim() : undefined,
        });
      }

      if (ev.captainNomination && ev.eventId) {
        try {
          await auctionService.nominateCaptain(ev.eventId, true, ev.proposedTeamName?.trim());
        } catch (capErr) {
          console.warn("Auction captain nomination hook error (non-fatal):", capErr);
        }
      }

      const formatText = formatsToRegister.length > 1
        ? ` (${formatsToRegister.map(f => f.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())).join(", ")})`
        : "";
      toast.success(`Successfully registered for ${ev.name}${formatText}!`);

      // Update state: mark this event as registered and unselect from batch
      setEventSelections(prev => prev.map(e => {
        if (e.eventId === eventId) {
          return { ...e, isRegistered: true, selected: false };
        }
        return e;
      }));
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || `Failed to register for ${ev.name}`;
      setEventErrors(prev => ({ ...prev, [eventId]: errMsg }));
      toast.error(errMsg);
    } finally {
      setRegisteringEventId(null);
    }
  };

  const selectedEvents = useMemo(() => {
    return eventSelections.filter(e => e.selected && !e.isRegistered);
  }, [eventSelections]);

  const selectedCount = selectedEvents.length;

  const registeredCount = useMemo(() => eventSelections.filter(e => e.isRegistered).length, [eventSelections]);

  // Distinct sport category counts (e.g. Cricket, Badminton, Football count as 1 sport each)
  const totalSportsCount = useMemo(() => {
    const set = new Set<string>();
    eventSelections.forEach(e => set.add(e.sportName || "Other"));
    return set.size;
  }, [eventSelections]);

  const selectedSportsCount = useMemo(() => {
    const set = new Set<string>();
    eventSelections.forEach(e => {
      if (e.selected && !e.isRegistered) {
        set.add(e.sportName || "Other");
      }
    });
    return set.size;
  }, [eventSelections]);

  const registeredSportsCount = useMemo(() => {
    const set = new Set<string>();
    eventSelections.forEach(e => {
      if (e.isRegistered) {
        set.add(e.sportName || "Other");
      }
    });
    return set.size;
  }, [eventSelections]);

  const sportGroups = useMemo(() => {
    const groups = new Map<string, SportEventSelection[]>();
    eventSelections.forEach(ev => {
      const key = ev.sportName || "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(ev);
    });

    return Array.from(groups.entries()).map(([sportName, events]) => {
      const meta = getSportMeta(sportName);
      const eligible: SportEventSelection[] = [];
      const ineligible: SportEventSelection[] = [];
      const registered: SportEventSelection[] = [];

      events.forEach(ev => {
        if (ev.isRegistered) {
          registered.push(ev);
        } else {
          const eventCats = getEventCategories(categories, ev.sportName || ev.name, ev.name, ev.categoryName);
          const selectedCat = categories.find(c => c.id === ev.categoryId) || eventCats[0];
          const elig = checkCategoryEligibility(selectedCat, currentAge, gender);
          if (elig.eligible) {
            eligible.push(ev);
          } else {
            ineligible.push(ev);
          }
        }
      });

      return {
        sportName,
        emoji: meta.emoji,
        bgClass: meta.bg,
        venueName: events.find(e => e.venueName)?.venueName,
        dateStart: events.find(e => e.eventDateStart)?.eventDateStart,
        eligible,
        ineligible,
        registered,
        allEvents: events,
      };
    });
  }, [eventSelections, categories, currentAge, gender]);

  const selectAll = () => {
    if (!gender || !dateOfBirth || currentAge === null) {
      toast.error("Please provide Gender and Date of Birth to select sports events.");
      openUpdateDetailsModal(regType === "family" ? (familyMemberId ? "family_edit" : "family_add") : "self", familyMemberId);
      return;
    }
    setEventSelections(prev => prev.map(e => {
      if (e.isRegistered) return e;
      const eventCats = getEventCategories(categories, e.sportName || e.name, e.name, e.categoryName);
      const selectedCat = categories.find(c => c.id === e.categoryId) || eventCats[0];
      const isEligible = checkCategoryEligibility(selectedCat, currentAge, gender).eligible;
      return { ...e, selected: isEligible };
    }));
  };

  const toggleSportSelectAll = (sportName: string, select: boolean) => {
    if (select && (!gender || !dateOfBirth || currentAge === null)) {
      toast.error("Please provide Gender and Date of Birth to select sports events.");
      openUpdateDetailsModal(regType === "family" ? (familyMemberId ? "family_edit" : "family_add") : "self", familyMemberId);
      return;
    }
    setEventSelections(prev => prev.map(e => {
      if ((e.sportName || "Other") !== sportName || e.isRegistered) return e;
      if (!select) return { ...e, selected: false };
      const eventCats = getEventCategories(categories, e.sportName || e.name, e.name, e.categoryName);
      const selectedCat = categories.find(c => c.id === e.categoryId) || eventCats[0];
      const isEligible = checkCategoryEligibility(selectedCat, currentAge, gender).eligible;
      return { ...e, selected: isEligible };
    }));
  };

  const deselectAll = () => {
    setEventSelections(prev => prev.map(e => ({ ...e, selected: false })));
  };

  // Comprehensive Submission Handler with Client-Side Eligibility Validation
  const handleSubmit = async () => {
    if (!gender || !dateOfBirth || currentAge === null) {
      toast.error("Please provide Gender and Date of Birth to proceed with sports registration.");
      openUpdateDetailsModal(regType === "family" ? (familyMemberId ? "family_edit" : "family_add") : "self", familyMemberId);
      return;
    }

    const errors: { playerName?: string; gender?: string; dateOfBirth?: string; email?: string } = {};
    if (!playerName.trim()) errors.playerName = "Participant name is required";
    if (!gender) errors.gender = "Gender is required";
    if (!dateOfBirth) errors.dateOfBirth = "Date of birth is mandatory for category validation";
    if (email.trim() && !isValidEmail(email)) errors.email = "Please enter a valid email address";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(errors.email || "Please complete the required participant information");
      return;
    }
    setFormErrors({});

    if (selectedEvents.length === 0) {
      toast.error("Please select at least one sport event to register");
      return;
    }

    // Validate Category Eligibility for ALL Selected Events
    const calculatedAge = currentAge !== null ? currentAge : 25;
    const newEventErrors: Record<number, string> = {};
    let hasEligibilityIssues = false;

    for (const ev of selectedEvents) {
      const selectedCategory = categories.find(c => c.id === ev.categoryId);
      if (!selectedCategory) {
        newEventErrors[ev.eventId] = "Please select a category bracket for this sport";
        hasEligibilityIssues = true;
        continue;
      }
      const eligibility = checkCategoryEligibility(selectedCategory, calculatedAge, gender);
      if (!eligibility.eligible) {
        newEventErrors[ev.eventId] = eligibility.reason || "Ineligible for selected category";
        hasEligibilityIssues = true;
      }
    }

    if (hasEligibilityIssues) {
      setEventErrors(newEventErrors);
      toast.error("Category eligibility mismatch. Please update the categories for the highlighted sports.");
      return;
    }

    setSubmitting(true);
    setEventErrors({});
    let successCount = 0;
    let failedCount = 0;
    const submissionErrors: Record<number, string> = {};

    for (const ev of selectedEvents) {
      const catId = ev.categoryId || categories[0]?.id || 1;
      const formatsToRegister = (ev.matchTypes && ev.matchTypes.length > 0) ? ev.matchTypes : [ev.matchType || "SINGLES"];
      for (const fmt of formatsToRegister) {
        const isDoubles = fmt.toUpperCase().includes("DOUBLES");
        try {
          await sportsService.registerForEvent({
            eventId: ev.eventId,
            categoryId: catId,
            matchType: fmt,
            role: ev.role || "Player",
            age: calculatedAge,
            dateOfBirth: dateOfBirth,
            playerName: playerName.trim(),
            email: email.trim() || undefined,
            relation: relation || undefined,
            flatNumber: flatNumber || undefined,
            familyMemberId: regType === "family" && familyMemberId && !isNaN(Number(familyMemberId)) ? Number(familyMemberId) : undefined,
            partnerUserId: isDoubles && ev.partnerUserId ? ev.partnerUserId : undefined,
            captainNomination: ev.captainNomination || undefined,
            proposedTeamName: ev.captainNomination && ev.proposedTeamName ? ev.proposedTeamName.trim() : undefined,
          });
          successCount++;
        } catch (err: any) {
          const fmtLabel = fmt.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
          const errMsg = err?.response?.data?.message || err?.message || `Failed to register for ${ev.name} (${fmtLabel})`;
          submissionErrors[ev.eventId] = errMsg;
          console.error(`Failed to register for ${ev.name}:`, err);
          failedCount++;
        }
      }

      if (ev.captainNomination && ev.eventId) {
        try {
          await auctionService.nominateCaptain(ev.eventId, true, ev.proposedTeamName?.trim());
        } catch (capErr) {
          console.warn("Auction captain nomination hook error (non-fatal):", capErr);
        }
      }
    }

    setSubmitting(false);

    if (failedCount > 0) {
      setEventErrors(submissionErrors);
    }

    if (successCount > 0 && failedCount === 0) {
      toast.success(`Successfully registered for ${successCount} sport${successCount > 1 ? "s" : ""}!`);
      navigate("/sports");
    } else if (successCount > 0 && failedCount > 0) {
      toast.warning(`Registered for ${successCount} event(s), but ${failedCount} failed. Please check errors.`);
    } else if (failedCount > 0) {
      toast.error("Failed to register. Please review the errors below.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] gap-4 p-8">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
          </div>
          <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-800">Loading Tournament Details</h3>
          <p className="text-sm text-slate-500 mt-1">Fetching events and categories...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 max-w-md mx-auto my-6">
        <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-600 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Tournament Not Available</h2>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
          This tournament does not have open events or registrations have closed.
        </p>
        <button
          onClick={() => navigate("/sports")}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-base font-semibold rounded-xl hover:opacity-95 shadow-md shadow-indigo-500/20 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Sports Hub
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pb-24 md:pb-8 max-w-7xl mx-auto px-2 sm:px-3">
      {/* ── Top Navigation Bar with Tournament Title ──────────────────── */}
      <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <button
          onClick={() => navigate("/sports")}
          className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 text-xs font-medium text-slate-700 hover:text-indigo-600 transition-all cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back to Hub</span>
          <span className="sm:hidden">Back</span>
        </button>

        <div className="flex items-center gap-2 min-w-0 px-1 text-center">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Trophy className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-[13px] sm:text-base md:text-lg font-bold text-slate-900 truncate leading-tight">
            {tournament.name}
          </h2>
          {tournament.events && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-semibold shrink-0">
              {tournament.events.length} sports
            </span>
          )}
        </div>

        <span className="hidden sm:flex px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider items-center gap-1 shadow-2xs shrink-0">
          <Sparkles className="w-3 h-3 text-indigo-500 animate-spin-slow" />
          <span className="hidden md:inline">Multi-Sport Registration</span>
          <span className="md:hidden">Register</span>
        </span>
      </div>

      {/* ── Main Layout: Participant Info (Col 4) & Sports Selection (Col 8) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 items-start">
        {/* ── Left Column: Participant Information (4 cols) ─────────── */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-3.5 shadow-2xs">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                <h4 className="text-[13px] sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5 shrink-0">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">1</span>
                  <span>Participant Details</span>
                </h4>
                {playerName && (
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 truncate max-w-[120px] sm:max-w-[160px]">
                    {playerName}
                  </span>
                )}
                {currentAge !== null && (
                  <span className="text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                    Age: {currentAge} Yrs
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Required</span>
            </div>

            {/* Self vs Family Member Toggle */}
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100/90 rounded-lg mb-2.5">
              <button
                type="button"
                onClick={() => handleRegTypeChange("self")}
                className={`min-h-[38px] py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[13px] sm:text-sm font-semibold ${
                  regType === "self"
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Myself</span>
              </button>
              <button
                type="button"
                onClick={() => handleRegTypeChange("family")}
                className={`min-h-[38px] py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[13px] sm:text-sm font-semibold ${
                  regType === "family"
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Family</span>
              </button>
            </div>

            {/* Quick Family Member Pills & Add Button */}
            {regType === "family" && (
              <div className="mb-2.5 p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                    Select Family Member:
                  </label>
                  <button
                    type="button"
                    onClick={() => openUpdateDetailsModal("family_add")}
                    className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-md shadow-2xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Member</span>
                  </button>
                </div>
                {familyMembersOnly.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {familyMembersOnly.map((m) => {
                      const isSelected = String(familyMemberId) === String(m.id);
                      const dobVal = m.dob || (m as any).dateOfBirth;
                      let formattedDob = "";
                      if (dobVal) {
                        try {
                          formattedDob = format(new Date(dobVal), "dd MMM yyyy");
                        } catch {
                          formattedDob = String(dobVal);
                        }
                      }
                      const isMissingDetails = !dobVal || !m.gender;

                      return (
                        <div
                          key={m.id}
                          onClick={() => handleFamilyMemberSelect(m.id)}
                          className={`min-h-[32px] text-xs px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer border flex-wrap select-none ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                          }`}
                        >
                          <span className="font-semibold">{m.name}</span>
                          {(m.relation || (m as any).relationship) && (
                            <span className={`text-[11px] px-1 py-0.2 rounded font-normal ${isSelected ? "bg-indigo-700/60 text-indigo-100" : "bg-slate-100 text-slate-500"}`}>
                              {m.relation || (m as any).relationship}
                            </span>
                          )}
                          {formattedDob ? (
                            <span className={`text-[11px] px-1 py-0.2 rounded font-normal ${isSelected ? "bg-indigo-700/60 text-indigo-100" : "bg-slate-100 text-slate-500"}`}>
                              DOB: {formattedDob}
                            </span>
                          ) : isMissingDetails ? (
                            <span className="text-[10px] text-amber-500 font-bold">⚠️ Incomplete</span>
                          ) : null}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openUpdateDetailsModal("family_edit", m.id);
                            }}
                            title="Edit details"
                            className={`ml-0.5 p-0.5 rounded text-[11px] transition ${
                              isSelected ? "hover:bg-indigo-700/80 text-white" : "hover:bg-slate-100 text-slate-500"
                            }`}
                          >
                            ✏️
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 py-0.5">
                    No family members added yet. Click &quot;Add Member&quot; to add details.
                  </div>
                )}

                {regType === "family" && playerName && (!gender || !dateOfBirth) && (
                  <div className="mt-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-2 flex items-center justify-between gap-2 text-left animate-in fade-in">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <p className="text-[11px] text-amber-800 dark:text-amber-200 font-medium">
                        Missing {(!gender && !dateOfBirth) ? "Gender & DOB" : !gender ? "Gender" : "Date of Birth"} for {playerName}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openUpdateDetailsModal("family_edit", familyMemberId)}
                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-md transition shadow-2xs flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                    >
                      <span>Update</span>
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Profile Incomplete Banner for Self */}
            {regType === "self" && missingProfileFields.length > 0 && (
              <div className="mb-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-left shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-lg flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                      Profile Incomplete: {missingProfileFields.join(", ")} Required
                    </h4>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium mt-0.5 leading-relaxed">
                      Your profile is missing {missingProfileFields.join(", ")}. Please update your profile before registering.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openUpdateDetailsModal("self")}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <span>Update Profile</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Registrant Details Display */}
            {regType === "family" ? (
              playerName ? (
                <div className="hidden md:block bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 space-y-2">
                  <div className="grid grid-cols-2 gap-2 items-start">
                    {/* Participant Full Name */}
                    <div className="min-w-0">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5 truncate">
                        Participant Name
                      </label>
                      <div className="w-full h-8 text-xs font-medium border border-slate-200 rounded-lg px-2.5 bg-white text-slate-900 flex items-center justify-between truncate">
                        <span className="truncate">{playerName}</span>
                        <button
                          type="button"
                          onClick={() => openUpdateDetailsModal("family_edit", familyMemberId)}
                          className="text-[10px] font-bold text-indigo-600 hover:underline shrink-0 ml-1 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Relationship */}
                    <div className="min-w-0">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5 truncate">
                        Relationship
                      </label>
                      <div className="w-full h-8 text-xs font-medium border border-slate-200 rounded-lg px-2.5 bg-white text-slate-900 flex items-center truncate">
                        {relation || "Family Member"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-start">
                    {/* Gender */}
                    <div className="min-w-0">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5 truncate">
                        Gender
                      </label>
                      <div className="w-full h-8 text-xs font-medium border border-slate-200 rounded-lg px-2.5 bg-white text-slate-900 flex items-center justify-between truncate">
                        <span className="truncate">{gender ? gender.toUpperCase() : "Not specified"}</span>
                        {!gender && (
                          <button
                            type="button"
                            onClick={() => openUpdateDetailsModal("family_edit", familyMemberId)}
                            className="text-[10px] font-bold text-amber-600 hover:underline shrink-0 ml-1 cursor-pointer"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>

                    {/* DOB & Age */}
                    <div className="min-w-0">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5 truncate">
                        DOB / Age
                      </label>
                      <div className="w-full h-8 text-xs font-medium border border-slate-200 rounded-lg px-2.5 bg-white text-slate-900 flex items-center justify-between truncate">
                        <span className="truncate">
                          {dateOfBirth ? (
                            <span>{format(new Date(dateOfBirth), "dd MMM yyyy")} {currentAge !== null ? `(${currentAge}y)` : ""}</span>
                          ) : (
                            <span className="text-amber-600 font-semibold">Not provided</span>
                          )}
                        </span>
                        {!dateOfBirth && (
                          <button
                            type="button"
                            onClick={() => openUpdateDetailsModal("family_edit", familyMemberId)}
                            className="text-[10px] font-bold text-amber-600 hover:underline shrink-0 ml-1 cursor-pointer"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Block & Flat */}
                    <div className="min-w-0">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5 truncate">
                        Block & Flat
                      </label>
                      <div className="w-full h-8 text-xs font-medium border border-slate-200 rounded-lg px-2.5 bg-white text-slate-900 flex items-center truncate">
                        {userProfileFlat || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden md:block p-3 bg-indigo-50/30 border border-dashed border-indigo-200 rounded-xl text-center space-y-1.5">
                  <p className="text-xs font-medium text-slate-600">
                    Please select a family member above or click &quot;Add Member&quot; to register them.
                  </p>
                </div>
              )
            ) : (
              /* Self Registration Details */
              <div className="hidden md:block space-y-2.5">
                {/* Row 1: Full Name & Gender */}
                <div className="grid grid-cols-2 gap-2 items-start">
                  <div className="min-w-0">
                    <div className="flex items-center justify-between h-4 mb-1">
                      <label className="text-xs font-medium text-slate-700 truncate">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => openUpdateDetailsModal("self")}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{!userProfileName ? "⚠️ Add" : "Edit"}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={userProfileName}
                      readOnly
                      placeholder={userProfileName || "Missing in Profile"}
                      className={`w-full h-8 text-xs border rounded-lg px-2.5 transition shadow-2xs ${
                        userProfileName
                          ? "bg-slate-100/70 border-slate-200 text-slate-800 cursor-not-allowed"
                          : "bg-amber-50/50 border-amber-300 text-amber-900"
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center justify-between h-4 mb-1">
                      <label className="text-xs font-medium text-slate-700 truncate">
                        Gender <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => openUpdateDetailsModal("self")}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{!userProfileGender ? "⚠️ Add" : "Edit"}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className={`w-full h-8 text-xs border rounded-lg px-2.5 flex items-center justify-between ${
                      userProfileGender
                        ? "bg-slate-100/70 border-slate-200 text-slate-800 cursor-not-allowed"
                        : "bg-amber-50/50 border-amber-300 text-amber-800"
                    }`}>
                      <span className="font-medium truncate">{userProfileGender ? userProfileGender.toUpperCase() : "Missing in Profile"}</span>
                      {!userProfileGender && (
                        <button
                          type="button"
                          onClick={() => openUpdateDetailsModal("self")}
                          className="text-xs font-bold text-amber-600 hover:underline cursor-pointer ml-1"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 2: DOB & Flat */}
                <div className="grid grid-cols-2 gap-2 items-start">
                  <div className="min-w-0">
                    <div className="flex items-center justify-between h-4 mb-1">
                      <label className="text-xs font-medium text-slate-700 truncate">
                        DOB <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-1">
                        {currentAge !== null && (
                          <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                            {currentAge}y
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => openUpdateDetailsModal("self")}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{!userProfileDob ? "⚠️ Add" : "Edit"}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className={`w-full h-8 text-xs border rounded-lg px-2.5 flex items-center justify-between ${
                      userProfileDob
                        ? "bg-slate-100/70 border-slate-200 text-slate-800 cursor-not-allowed"
                        : "bg-amber-50/50 border-amber-300 text-amber-800"
                    }`}>
                      <span className="font-medium truncate">
                        {userProfileDob ? format(new Date(userProfileDob), "dd MMM yyyy") : "Missing in Profile"}
                      </span>
                      {!userProfileDob && (
                        <button
                          type="button"
                          onClick={() => openUpdateDetailsModal("self")}
                          className="text-xs font-bold text-amber-600 hover:underline cursor-pointer ml-1"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center justify-between h-4 mb-1">
                      <label className="text-xs font-medium text-slate-700 truncate">
                        Block & Flat <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => openUpdateDetailsModal("self")}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{!userProfileFlat ? "⚠️ Add" : "Edit"}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={userProfileFlat || flatNumber}
                      readOnly
                      placeholder={userProfileFlat || "Missing in Profile"}
                      className={`w-full h-8 text-xs border rounded-lg px-2.5 transition shadow-2xs ${
                        userProfileFlat
                          ? "bg-slate-100/70 border-slate-200 text-slate-800 cursor-not-allowed"
                          : "bg-amber-50/50 border-amber-300 text-amber-900"
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Summary & Submit Card */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-violet-50/60 to-purple-50/40 border border-indigo-100/90 rounded-xl p-3 shadow-2xs hidden md:block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-800">Summary:</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                {selectedCount} Selected
              </span>
            </div>

            {selectedCount > 0 ? (
              <div className="mb-2.5 space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {selectedEvents.map(e => {
                  const meta = getSportMeta(e.sportName || e.name);
                  const selCat = categories.find(c => c.id === e.categoryId);
                  const el = checkCategoryEligibility(selCat, currentAge, gender);

                  return (
                    <div
                      key={e.eventId}
                      className={`flex flex-col gap-0.5 text-xs p-2 rounded-lg border ${
                        !el.eligible || eventErrors[e.eventId]
                          ? "bg-rose-50/80 border-rose-200 text-rose-900"
                          : "bg-white/90 border-indigo-100/60 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate flex items-center gap-1">
                          <span>{meta.emoji}</span>
                          <span className="truncate">{e.name}</span>
                        </span>
                        <span className="text-xs text-indigo-600 font-bold shrink-0">
                          {e.role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate font-medium text-slate-600">
                          {selCat ? selCat.name : "No category"}
                        </span>
                        {!el.eligible ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Ineligible
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Eligible
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mb-2.5 flex items-center gap-1.5 bg-white/70 p-2 rounded-lg border border-slate-200/60">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Select sports from the right.
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selectedCount === 0 || !gender || !dateOfBirth || currentAge === null}
              className="w-full min-h-[40px] py-2 px-3.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting ({selectedCount})...</span>
                </>
              ) : !gender || !dateOfBirth || currentAge === null ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Provide DOB &amp; Gender to Register</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Register ({selectedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Right Column: Available Sports Selection (8 cols) ──────── */}
        <div className="lg:col-span-8 space-y-2.5">
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs shrink-0">2</span>
                <h2 className="text-[13px] sm:text-sm font-semibold text-slate-900">Choose Sports</h2>
                <span className="text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                  {selectedSportsCount}/{totalSportsCount}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={!gender || !dateOfBirth || currentAge === null}
                  className="min-h-[32px] text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="min-h-[32px] text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {totalSportsCount > 0 && (
              <div className="mb-2.5">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-slate-500 mb-1">
                  <span>{registeredSportsCount} of {totalSportsCount} registered</span>
                  <span>{Math.round((registeredSportsCount / totalSportsCount) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${(registeredSportsCount / totalSportsCount) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Registration Disabled Banner if Gender or DOB missing */}
            {(!gender || !dateOfBirth || currentAge === null) && (
              <div className="mb-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-left shadow-2xs animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 rounded-lg shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                      Sports Event Registration Disabled
                    </h4>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium mt-0.5 leading-relaxed">
                      Please provide {(!gender && !dateOfBirth) ? "Gender and Date of Birth" : !gender ? "Gender" : "Date of Birth"} to verify category eligibility and unlock event registration.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openUpdateDetailsModal(regType === "family" ? (familyMemberId ? "family_edit" : "family_add") : "self", familyMemberId)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <span>Update Details</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Grouped sport cards */}
            <div className="space-y-2.5">
              {sportGroups.map((group) => {
                const sportKey = detectSport(group.sportName);
                const cfg = SPORT_CONFIGS[sportKey] || SPORT_CONFIGS.generic;
                const roles = cfg.categories.flatMap(c => c.roles);
                const isExpanded = expandedSports[group.sportName] !== false; // expanded by default
                const eligibleSelectedCount = group.eligible.filter(e => e.selected).length;
                const isAllEligibleSelected = group.eligible.length > 0 && eligibleSelectedCount === group.eligible.length;

                return (
                  <div key={group.sportName} className="rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                    {/* Sport Group Header */}
                    <div
                      className={`px-2.5 py-2.5 sm:px-3 sm:py-2.5 ${group.bgClass} border-b flex items-center justify-between gap-2 cursor-pointer select-none transition-colors hover:brightness-98`}
                      onClick={() => toggleSportCollapse(group.sportName)}
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        {group.eligible.length > 0 && (
                          <div
                            className="flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isAllEligibleSelected}
                              ref={el => {
                                if (el) {
                                  el.indeterminate = eligibleSelectedCount > 0 && !isAllEligibleSelected;
                                }
                              }}
                              onChange={(e) => toggleSportSelectAll(group.sportName, e.target.checked)}
                              title={isAllEligibleSelected ? "Deselect all categories in this sport" : "Select all eligible categories"}
                              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                            />
                          </div>
                        )}

                        <span className="text-lg sm:text-xl shrink-0">{group.emoji}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <h3 className="text-[13px] sm:text-sm font-bold truncate">{group.sportName}</h3>
                            {eligibleSelectedCount > 0 && (
                              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                                {eligibleSelectedCount} selected
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 text-[10px] sm:text-[11px] opacity-75 mt-0.5">
                            {group.venueName && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {group.venueName}
                              </span>
                            )}
                            {group.dateStart && (
                              <span className="flex items-center gap-0.5">
                                <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {format(new Date(group.dateStart), "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {group.registered.length > 0 && (
                          <span className="hidden sm:inline text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            {group.registered.length} Reg
                          </span>
                        )}
                        <span className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-white/70 border text-slate-700">
                          {group.allEvents.length} {group.allEvents.length === 1 ? "Cat" : "Cats"}
                        </span>
                        <button
                          type="button"
                          aria-label={isExpanded ? "Collapse sport" : "Expand sport"}
                          className="p-0.5 sm:p-1 rounded-md hover:bg-black/5 text-slate-600 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Category Rows */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-100 bg-white">
                        {/* Eligible categories */}
                        {group.eligible.map((ev) => {
                          const eventCats = getEventCategories(categories, ev.sportName || ev.name, ev.name, ev.categoryName);
                          const selectedCat = categories.find(c => c.id === ev.categoryId) || eventCats[0];
                          const hasError = Boolean(eventErrors[ev.eventId]);

                          return (
                            <div key={ev.eventId} className={`px-2.5 py-2 sm:px-3 sm:py-2.5 transition-colors ${
                              ev.selected ? "bg-indigo-50/40" : hasError ? "bg-rose-50/30" : "hover:bg-slate-50/50"
                            }`}>
                              <div className="flex items-center gap-2 sm:gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={ev.selected}
                                  onChange={() => toggleEventSelection(ev.eventId)}
                                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                                    <span className="text-[13px] sm:text-sm font-semibold text-slate-900">{ev.name}</span>
                                    {selectedCat && (
                                      <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium whitespace-nowrap">
                                        {selectedCat.gender && selectedCat.gender.toUpperCase() !== "ALL" ? `${selectedCat.gender} · ` : ""}
                                        {selectedCat.minAge != null && selectedCat.maxAge != null
                                          ? (selectedCat.maxAge >= 90 ? `${selectedCat.minAge}+` : selectedCat.minAge <= 0 ? `U-${selectedCat.maxAge}` : `${selectedCat.minAge}–${selectedCat.maxAge}`)
                                          : (selectedCat.minAge != null ? `${selectedCat.minAge}+` : selectedCat.maxAge != null ? `U-${selectedCat.maxAge}` : "All Ages")
                                        } yrs
                                      </span>
                                    )}
                                  </div>
                                  {eventErrors[ev.eventId] && (
                                    <p className="text-[10px] sm:text-[11px] text-rose-600 mt-0.5 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" /> {eventErrors[ev.eventId]}
                                    </p>
                                  )}
                                </div>

                                <select
                                  value={ev.role}
                                  onChange={(e) => updateEventField(ev.eventId, "role", e.target.value)}
                                  className="hidden sm:block h-8 text-xs font-medium border border-slate-200 rounded-lg px-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-32 shrink-0"
                                >
                                  {roles.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  onClick={() => handleSingleRegister(ev.eventId)}
                                  disabled={registeringEventId === ev.eventId}
                                  className="min-h-[32px] px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
                                >
                                  {registeringEventId === ev.eventId ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  <span className="hidden sm:inline">Register</span>
                                </button>
                              </div>
                              {/* Dropdowns & Options section (participant formats, category bracket & mobile role) */}
                              <div className="mt-1.5 pl-6 sm:pl-6 space-y-2 w-full max-w-full overflow-hidden">
                                {/* Participant Type (Format Multi-selection, e.g. Singles, Doubles, Mixed Doubles) */}
                                {ev.availableFormats && ev.availableFormats.length > 0 && (
                                  <div className="w-full max-w-full">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                                        Participant Type:
                                      </label>
                                      {ev.availableFormats.length > 1 && (
                                        <span className="text-[10px] text-slate-400 font-normal">
                                          (Select one or more)
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {ev.availableFormats.map((fmt) => {
                                        const selectedList = ev.matchTypes || [ev.matchType || "SINGLES"];
                                        const isFmtSelected = selectedList.some(f => f.toUpperCase() === fmt.toUpperCase());
                                        const formatLabel = fmt.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                                        return (
                                          <button
                                            key={fmt}
                                            type="button"
                                            onClick={() => toggleEventFormat(ev.eventId, fmt)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition select-none cursor-pointer border ${
                                              isFmtSelected
                                                ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                          >
                                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition ${
                                              isFmtSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                                            }`}>
                                              {isFmtSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                            </div>
                                            <span>{formatLabel}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                {/* Doubles / Mixed Doubles Partner Selection */}
                                {((ev.matchTypes && ev.matchTypes.length > 0 ? ev.matchTypes : [ev.matchType || "SINGLES"]).some(f => f.toUpperCase().includes("DOUBLES"))) && (
                                  <div className="w-full mt-2 pt-2 border-t border-slate-100">
                                    <SportsPartnerSelector
                                      selectedPartner={ev.partnerInfo}
                                      onChange={(partner) => {
                                        setEventSelections(prev => prev.map(item => {
                                          if (item.eventId === ev.eventId) {
                                            return {
                                              ...item,
                                              partnerInfo: partner,
                                              partnerUserId: partner?.userId || null,
                                            };
                                          }
                                          return item;
                                        }));
                                      }}
                                      matchType={
                                        (ev.matchTypes && ev.matchTypes.find(f => f.toUpperCase().includes("DOUBLES"))) ||
                                        (ev.matchType && ev.matchType.toUpperCase().includes("DOUBLES") ? ev.matchType : "DOUBLES")
                                      }
                                      currentGender={gender}
                                      currentUserId={user?.userId || (user as any)?.id}
                                      communityId={user?.communityId}
                                      familyMembers={savedFamilyMembers}
                                      disabled={submitting || registeringEventId === ev.eventId}
                                    />
                                  </div>
                                )}
                                {/* Team Captain Nomination (Cricket, Football, and other Team Sports) */}
                                {isTeamSport(ev.sportName || ev.name) && (
                                  <div className="w-full mt-2 pt-2 border-t border-slate-100">
                                    <div className="bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-orange-500/5 border border-amber-500/30 rounded-xl p-3 space-y-2.5">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2">
                                          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                            <Crown className="w-3.5 h-3.5 text-amber-600" />
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="text-xs font-bold text-slate-800">
                                                Nominate as Team Captain
                                              </span>
                                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                                Optional
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                              Lead a team & participate in the player auction/draft
                                            </p>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEventSelections(prev => prev.map(item => {
                                              if (item.eventId === ev.eventId) {
                                                return { ...item, captainNomination: !item.captainNomination };
                                              }
                                              return item;
                                            }));
                                          }}
                                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            ev.captainNomination ? "bg-amber-600" : "bg-slate-300"
                                          }`}
                                        >
                                          <span
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                              ev.captainNomination ? "translate-x-4" : "translate-x-0"
                                            }`}
                                          />
                                        </button>
                                      </div>

                                      {ev.captainNomination && (
                                        <div className="pt-2 border-t border-amber-500/20 animate-in fade-in slide-in-from-top-1 duration-150 space-y-1.5">
                                          <label className="block text-[10px] font-bold text-slate-700">
                                            Proposed Team Name <span className="text-slate-400 font-normal">(Optional)</span>
                                          </label>
                                          <input
                                            type="text"
                                            placeholder="e.g. Royal Strikers"
                                            value={ev.proposedTeamName || ""}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setEventSelections(prev => prev.map(item => {
                                                if (item.eventId === ev.eventId) {
                                                  return { ...item, proposedTeamName: val };
                                                }
                                                return item;
                                              }));
                                            }}
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-300/80 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {/* Category selection for multi-category events */}
                                {eventCats.length > 1 && (
                                  <div className="w-full max-w-full">
                                    <label className="sm:hidden block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                                      Age Bracket:
                                    </label>
                                    {/* Desktop Select */}
                                    <select
                                      value={ev.categoryId || ""}
                                      onChange={(e) => updateEventField(ev.eventId, "categoryId", Number(e.target.value))}
                                      className="hidden sm:block box-border h-8 text-xs font-medium border border-slate-200 rounded-lg px-2 bg-white text-slate-700 w-auto min-w-[180px] max-w-full truncate focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    >
                                      {eventCats.map(c => {
                                        const itemEl = checkCategoryEligibility(c, currentAge, gender);
                                        const ageLabel = c.minAge != null && c.maxAge != null
                                          ? (c.maxAge >= 90 ? `${c.minAge}+` : c.minAge <= 0 ? `U-${c.maxAge}` : `${c.minAge}–${c.maxAge}`)
                                          : (c.minAge != null ? `${c.minAge}+` : c.maxAge != null ? `U-${c.maxAge}` : "All");
                                        return (
                                          <option key={c.id} value={c.id} className="text-xs truncate">
                                            {c.name} ({ageLabel} yrs) {!itemEl.eligible ? "— Ineligible" : ""}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    {/* Mobile Custom Trigger Button */}
                                    <button
                                      type="button"
                                      onClick={() => toggleInlinePicker(ev.eventId, "category")}
                                      className="sm:hidden w-full h-8 px-2.5 bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-medium text-slate-800 flex items-center justify-between gap-1.5 transition text-left"
                                    >
                                      <span className="truncate">
                                        {selectedCat?.name || "Select Category"}
                                      </span>
                                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${openInlinePicker?.eventId === ev.eventId && openInlinePicker?.type === "category" ? "rotate-180 text-indigo-600" : ""}`} />
                                    </button>

                                    {/* Full-width inline category options list inside parent div */}
                                    {openInlinePicker?.eventId === ev.eventId && openInlinePicker?.type === "category" && (
                                      <div className="sm:hidden mt-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1 w-full max-h-56 overflow-y-auto">
                                        {eventCats.map(c => {
                                          const itemEl = checkCategoryEligibility(c, currentAge, gender);
                                          const isSelected = (ev.categoryId || eventCats[0]?.id) === c.id;
                                          const ageLabel = c.minAge != null && c.maxAge != null
                                            ? (c.maxAge >= 90 ? `${c.minAge}+` : c.minAge <= 0 ? `U-${c.maxAge}` : `${c.minAge}–${c.maxAge}`)
                                            : (c.minAge != null ? `${c.minAge}+` : c.maxAge != null ? `U-${c.maxAge}` : "All");
                                          return (
                                            <button
                                              key={c.id}
                                              type="button"
                                              disabled={!itemEl.eligible}
                                              onClick={() => {
                                                updateEventField(ev.eventId, "categoryId", c.id);
                                                setOpenInlinePicker(null);
                                              }}
                                              className={`w-full p-2 rounded-lg text-left transition flex items-center justify-between gap-2 ${
                                                isSelected
                                                  ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold"
                                                  : !itemEl.eligible
                                                  ? "opacity-50 cursor-not-allowed bg-slate-50/50 text-slate-400 border border-transparent"
                                                  : "hover:bg-slate-50 text-slate-800 border border-transparent"
                                              }`}
                                            >
                                              <div className="min-w-0 flex-1">
                                                <div className="text-xs font-semibold truncate leading-tight">
                                                  {c.name}
                                                </div>
                                                <div className={`text-[10px] mt-0.5 ${!itemEl.eligible ? "text-rose-500" : "text-slate-500"}`}>
                                                  {ageLabel} yrs · {!itemEl.eligible ? `Ineligible (${itemEl.reason || ""})` : "Eligible"}
                                                </div>
                                              </div>
                                              {isSelected && (
                                                <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 stroke-[2.5]" />
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Mobile role selection */}
                                <div className="sm:hidden w-full max-w-full">
                                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                                    Playing Role:
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => toggleInlinePicker(ev.eventId, "role")}
                                    className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-medium text-slate-800 flex items-center justify-between gap-1.5 transition text-left"
                                  >
                                    <span className="truncate">
                                      {ev.role || roles[0] || "Select Role"}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${openInlinePicker?.eventId === ev.eventId && openInlinePicker?.type === "role" ? "rotate-180 text-indigo-600" : ""}`} />
                                  </button>

                                  {/* Full-width inline role options list inside parent div */}
                                  {openInlinePicker?.eventId === ev.eventId && openInlinePicker?.type === "role" && (
                                    <div className="mt-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1 w-full max-h-56 overflow-y-auto">
                                      {roles.map(r => {
                                        const isSelected = (ev.role || roles[0]) === r;
                                        return (
                                          <button
                                            key={r}
                                            type="button"
                                            onClick={() => {
                                              updateEventField(ev.eventId, "role", r);
                                              setOpenInlinePicker(null);
                                            }}
                                            className={`w-full p-2 rounded-lg text-left transition flex items-center justify-between gap-2 ${
                                              isSelected
                                                ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold"
                                                : "hover:bg-slate-50 text-slate-800 border border-transparent"
                                            }`}
                                          >
                                            <span className="text-xs truncate flex-1">{r}</span>
                                            {isSelected && (
                                              <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 stroke-[2.5]" />
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Registered categories */}
                        {group.registered.map((ev) => {
                          const eventCats = getEventCategories(categories, ev.sportName || ev.name, ev.name, ev.categoryName);
                          const selectedCat = categories.find(c => c.id === ev.categoryId) || eventCats[0];

                          return (
                            <div key={ev.eventId} className="px-2.5 py-2 sm:px-3 sm:py-2.5 bg-emerald-50/30">
                              <div className="flex items-center gap-2 sm:gap-2.5">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                                    <span className="text-[13px] sm:text-sm font-semibold text-slate-700">{ev.name}</span>
                                    {selectedCat && (
                                      <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-medium whitespace-nowrap">
                                        {selectedCat.gender && selectedCat.gender.toUpperCase() !== "ALL" ? `${selectedCat.gender} · ` : ""}
                                        {selectedCat.minAge != null && selectedCat.maxAge != null
                                          ? (selectedCat.maxAge >= 90 ? `${selectedCat.minAge}+` : selectedCat.minAge <= 0 ? `U-${selectedCat.maxAge}` : `${selectedCat.minAge}–${selectedCat.maxAge}`)
                                          : (selectedCat.minAge != null ? `${selectedCat.minAge}+` : selectedCat.maxAge != null ? `U-${selectedCat.maxAge}` : "All Ages")
                                        } yrs
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shrink-0">
                                  <Check className="w-3 h-3 stroke-[2.5]" /> Registered
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Ineligible categories */}
                        {group.ineligible.length > 0 && (
                          <>
                            <div className="px-2.5 sm:px-3 py-1.5 bg-rose-50/40 border-t border-rose-100">
                              <span className="text-[10px] sm:text-[11px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Ineligible
                              </span>
                            </div>
                            {group.ineligible.map((ev) => {
                              const eventCats = getEventCategories(categories, ev.sportName || ev.name, ev.name, ev.categoryName);
                              const selectedCat = categories.find(c => c.id === ev.categoryId) || eventCats[0];
                              const eligibility = checkCategoryEligibility(selectedCat, currentAge, gender);

                              return (
                                <div key={ev.eventId} className="px-2.5 py-2 sm:px-3 sm:py-2 bg-rose-50/20 opacity-60">
                                  <div className="flex items-center gap-2 sm:gap-2.5">
                                    <div className="w-4 h-4 rounded border-2 border-slate-200 bg-slate-50 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                                        <span className="text-[13px] sm:text-sm font-medium text-slate-500">{ev.name}</span>
                                        {selectedCat && (
                                          <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-400 border border-rose-200 font-medium whitespace-nowrap">
                                            {selectedCat.gender && selectedCat.gender.toUpperCase() !== "ALL" ? `${selectedCat.gender} · ` : ""}
                                            {selectedCat.minAge != null && selectedCat.maxAge != null
                                              ? (selectedCat.maxAge >= 90 ? `${selectedCat.minAge}+` : selectedCat.minAge <= 0 ? `U-${selectedCat.maxAge}` : `${selectedCat.minAge}–${selectedCat.maxAge}`)
                                              : (selectedCat.minAge != null ? `${selectedCat.minAge}+` : selectedCat.maxAge != null ? `U-${selectedCat.maxAge}` : "All Ages")
                                            } yrs
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] sm:text-[11px] text-rose-500 mt-0.5">{eligibility.reason}</p>
                                    </div>
                                    <span className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-500 text-[10px] sm:text-[11px] font-bold shrink-0">
                                      Ineligible
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Bottom Bar on Mobile for Instant Registration ── */}
      <div className="fixed bottom-0 left-0 right-0 px-3 py-2.5 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg z-30 md:hidden safe-area-bottom">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-slate-900">
              {selectedCount} Sport{selectedCount !== 1 ? "s" : ""} Selected
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {playerName || "Participant"} {currentAge !== null ? `· ${currentAge} yrs` : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedCount === 0 || !gender || !dateOfBirth || currentAge === null}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-bold shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 active:scale-95"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : !gender || !dateOfBirth || currentAge === null ? (
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{!gender || !dateOfBirth || currentAge === null ? "Provide DOB & Gender" : "Register Now"}</span>
          </button>
        </div>
      </div>

      {/* ── Unified Update Details / Add Family Modal ── */}
      {profileModalState.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-100 relative my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  profileModalState.mode === "self"
                    ? "bg-indigo-50 text-indigo-600"
                    : profileModalState.mode === "family_edit"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}>
                  {profileModalState.mode === "self" ? (
                    <User className="w-5 h-5" />
                  ) : profileModalState.mode === "family_edit" ? (
                    <Edit3 className="w-5 h-5" />
                  ) : (
                    <UserPlus className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {profileModalState.mode === "self"
                      ? "Update Your Details (Self)"
                      : profileModalState.mode === "family_edit"
                      ? "Update Family Member Details"
                      : "Add Family Member"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {profileModalState.mode === "self"
                      ? "Gender & DOB are required to verify sports category eligibility"
                      : profileModalState.mode === "family_edit"
                      ? `Update Gender & DOB for ${profileModalState.name || "member"}`
                      : "Add details to register them for sports"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalState(prev => ({ ...prev, open: false }))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProfileModalSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileModalState.name}
                  onChange={(e) => setProfileModalState({ ...profileModalState, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full h-10 text-sm border border-slate-200 rounded-xl px-3 bg-slate-50/50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {profileModalState.mode !== "self" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Relationship <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={profileModalState.relation}
                      onChange={(e) => {
                        const rel = e.target.value;
                        let autoGender = profileModalState.gender;
                        if (rel === "Wife" || rel === "Mother" || rel === "Daughter" || rel === "Sister") {
                          autoGender = "Female";
                        } else if (rel === "Husband" || rel === "Father" || rel === "Son" || rel === "Brother") {
                          autoGender = "Male";
                        }
                        setProfileModalState({ ...profileModalState, relation: rel, gender: autoGender });
                      }}
                      className="w-full h-10 text-sm border border-slate-200 rounded-xl px-2.5 bg-slate-50/50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                    >
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Wife">Wife</option>
                      <option value="Husband">Husband</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={profileModalState.gender}
                      onChange={(e) => setProfileModalState({ ...profileModalState, gender: e.target.value })}
                      className="w-full h-10 text-sm border border-slate-200 rounded-xl px-2.5 bg-slate-50/50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={profileModalState.gender}
                    onChange={(e) => setProfileModalState({ ...profileModalState, gender: e.target.value })}
                    className="w-full h-10 text-sm border border-slate-200 rounded-xl px-2.5 bg-slate-50/50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  {profileModalState.dob && calculateAge(profileModalState.dob) !== null && (
                    <span className="text-[11px] font-bold px-2 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {calculateAge(profileModalState.dob)} yrs old
                    </span>
                  )}
                </div>
                <DatePicker
                  value={profileModalState.dob}
                  onChange={(val) => setProfileModalState({ ...profileModalState, dob: val || "" })}
                  max={new Date().toISOString().split("T")[0]}
                  presets={false}
                  placeholder="Select Date of Birth"
                  className="h-10 text-sm rounded-xl px-2.5 bg-slate-50/50 border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileModalState.phone}
                    onChange={(e) => setProfileModalState({ ...profileModalState, phone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full h-10 text-sm border border-slate-200 rounded-xl px-3 bg-slate-50/50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>

                {profileModalState.mode === "self" ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Flat / Villa No.
                    </label>
                    <input
                      type="text"
                      value={profileModalState.flatNo || ""}
                      onChange={(e) => setProfileModalState({ ...profileModalState, flatNo: e.target.value })}
                      placeholder="e.g. A-402"
                      className="w-full h-10 text-sm border border-slate-200 rounded-xl px-3 bg-slate-50/50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Blood Group
                    </label>
                    <input
                      type="text"
                      value={profileModalState.bloodGroup || ""}
                      onChange={(e) => setProfileModalState({ ...profileModalState, bloodGroup: e.target.value })}
                      placeholder="e.g. O+, B+"
                      className="w-full h-10 text-sm border border-slate-200 rounded-xl px-3 bg-slate-50/50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setProfileModalState(prev => ({ ...prev, open: false }))}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfileModal}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {savingProfileModal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>{profileModalState.mode === "self" ? "Save Profile" : "Save Details"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
