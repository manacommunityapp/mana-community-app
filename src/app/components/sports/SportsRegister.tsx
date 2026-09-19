import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Loader2, ArrowLeft, Info, Mail, ShieldCheck, CheckCircle2, Trophy, Calendar, AlertTriangle, ArrowUpRight, UserCheck, Check, X, Plus, UserPlus, Upload, FileUp, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { sportsService } from "../../../services/sports/sportsService";
import { sportsDashboardService, type DashboardEventCard } from "../../../services/sports/sportsDashboardService";
import { SportsPartnerSelector, type SelectedPartnerInfo } from "./SportsPartnerSelector";
import { otpService } from "../../../services/common/otpService";
import { familyService, type FamilyMember } from "../../../services/common/familyService";
import { userService } from "../../../services/common/userService";
import { useAuth } from "../../../contexts/AuthContext";
import {
  CREATE_EDIT_EVENT_REGISTRATIONS,
  CREATE_EDIT_SPORTS_MAIN,
} from "../../../constants/permissions";
import { DatePicker } from "../ui/date-picker";
import { format } from "date-fns";
import { isValidIndianPhone, isValidEmail } from "./sportsValidation";
import type { SportsEvent, PlayerCategory } from "../../../types/api";

function detectSport(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("cricket")) return "cricket";
  if (n.includes("football") || n.includes("soccer")) return "football";
  if (n.includes("volleyball")) return "volleyball";
  if (n.includes("basketball")) return "basketball";
  if (n.includes("badminton") || n.includes("shuttle")) return "badminton";
  if (n.includes("table tennis") || n.includes("tt") || n.includes("ping pong")) return "table tennis";
  if (n.includes("tennis")) return "tennis";
  if (n.includes("pickleball")) return "pickleball";
  if (n.includes("squash")) return "squash";
  if (n.includes("padel")) return "padel";
  if (n.includes("carrom")) return "carrom";
  if (n.includes("chess")) return "chess";
  if (n.includes("kabaddi")) return "kabaddi";
  if (n.includes("hockey")) return "hockey";
  if (n.includes("throwball")) return "throwball";
  if (n.includes("rugby")) return "rugby";
  return "generic";
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

function getEventFormats(event: SportsEvent | null): string[] {
  if (!event) return [];
  const eName = (event.name || "").toLowerCase();
  const sName = (event.sport?.name || (event as any).sportName || "").toLowerCase();
  const tName = ((event as any).tournamentName || (event as any).tournament?.name || "").toLowerCase();
  const combined = `${sName} ${tName} ${eName}`;
  const sKey = detectSport(combined);

  // 1. Check if event explicitly specifies formats
  const rawExplicit =
    event.format ||
    (event as any).formats ||
    event.sport?.formats ||
    event.sport?.format ||
    (event as any).tournament?.format ||
    (event as any).tournament?.formats;

  const parsedExplicit = normalizeFormatList(rawExplicit);
  if (parsedExplicit.length > 0) {
    if ((eName.includes("mixed") || eName.includes("mixed doubles")) && parsedExplicit.length === 1 && parsedExplicit.includes("MIXED_DOUBLES")) {
      return ["MIXED_DOUBLES"];
    }
    return parsedExplicit;
  }

  // 2. Check event name keywords for specific format
  if (eName.includes("singles") && eName.includes("doubles")) {
    return eName.includes("mixed") ? ["SINGLES", "DOUBLES", "MIXED_DOUBLES"] : ["SINGLES", "DOUBLES"];
  }
  if (eName.includes("mixed") || eName.includes("mixed doubles")) {
    return ["MIXED_DOUBLES"];
  }
  if (eName.includes("doubles") && !eName.includes("singles")) {
    return ["DOUBLES"];
  }

  // 3. Default available formats based on sport type
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
    combined.includes("athletics")
  ) {
    return ["INDIVIDUAL", "RELAY"];
  }

  return ["SINGLES", "DOUBLES"];
}

interface StatField {
  name: "matches" | "runs" | "wickets" | "strikeRate" | "avgScore";
  label: string;
  step?: number;
}

interface CategoryOption {
  value: string;
  label: string;
  roles: string[];
}

interface SportConfig {
  categories: CategoryOption[];
  stats: StatField[];
}

const SPORT_CONFIGS: Record<string, SportConfig> = {
  cricket: {
    categories: [
      {
        value: "BATSMEN", label: "Batsmen",
        roles: ["Right Hand Batsman", "Left Hand Batsman"],
      },
      {
        value: "BOWLERS", label: "Bowlers",
        roles: [
          "Right Arm Fast", "Right Arm Medium", "Right Arm Off Spin", "Right Arm Leg Spin",
          "Left Arm Fast", "Left Arm Medium", "Left Arm Spin (Orthodox)", "Left Arm Spin (Chinaman)",
        ],
      },
      {
        value: "ALL_ROUNDERS", label: "All-Rounders",
        roles: ["Batting All-Rounder", "Bowling All-Rounder", "Right Hand Batsman", "Left Hand Batsman"],
      },
      {
        value: "WICKET_KEEPERS", label: "Wicket-Keepers",
        roles: ["Wicketkeeper Batsman"],
      },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Runs" },
      { name: "wickets", label: "Wickets" },
      { name: "strikeRate", label: "Strike Rate", step: 0.01 },
      { name: "avgScore", label: "Batting Average", step: 0.01 },
    ],
  },
  football: {
    categories: [
      { value: "GOALKEEPER", label: "Goalkeeper", roles: ["Goalkeeper"] },
      {
        value: "DEFENDER", label: "Defender",
        roles: ["Center Back", "Right Back", "Left Back", "Sweeper"],
      },
      {
        value: "MIDFIELDER", label: "Midfielder",
        roles: ["Central Midfielder", "Defensive Midfielder", "Attacking Midfielder", "Right Winger", "Left Winger"],
      },
      {
        value: "FORWARD", label: "Forward",
        roles: ["Striker", "Center Forward", "Left Forward", "Right Forward"],
      },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Goals" },
      { name: "wickets", label: "Assists" },
      { name: "strikeRate", label: "Pass Accuracy (%)", step: 0.01 },
      { name: "avgScore", label: "Goals Per Game", step: 0.01 },
    ],
  },
  volleyball: {
    categories: [
      { value: "OUTSIDE_HITTER", label: "Outside Hitter", roles: ["Left Side", "Right Side"] },
      { value: "MIDDLE_BLOCKER", label: "Middle Blocker", roles: ["Middle Blocker"] },
      { value: "SETTER", label: "Setter", roles: ["Setter"] },
      { value: "LIBERO", label: "Libero", roles: ["Libero"] },
      { value: "OPPOSITE_HITTER", label: "Opposite Hitter", roles: ["Opposite Hitter"] },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Points / Kills" },
      { name: "wickets", label: "Blocks" },
      { name: "strikeRate", label: "Aces" },
      { name: "avgScore", label: "Digs", step: 0.01 },
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
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Points" },
      { name: "wickets", label: "Rebounds" },
      { name: "strikeRate", label: "Assists" },
      { name: "avgScore", label: "Points Per Game", step: 0.01 },
    ],
  },
  badminton: {
    categories: [
      { value: "SINGLES", label: "Singles", roles: ["Men's Singles", "Women's Singles"] },
      { value: "DOUBLES", label: "Doubles", roles: ["Men's Doubles", "Women's Doubles"] },
      { value: "MIXED_DOUBLES", label: "Mixed Doubles", roles: ["Mixed Doubles"] },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Wins" },
      { name: "wickets", label: "Titles" },
      { name: "strikeRate", label: "Win Rate (%)", step: 0.01 },
      { name: "avgScore", label: "Avg Smash Speed (km/h)", step: 0.01 },
    ],
  },
  kabaddi: {
    categories: [
      {
        value: "RAIDER", label: "Raider",
        roles: ["Strong Raider", "Touch Specialist", "Running Hand Touch"],
      },
      {
        value: "DEFENDER", label: "Defender",
        roles: ["Left Corner", "Right Corner", "Cover"],
      },
      {
        value: "ALL_ROUNDER", label: "All-Rounder",
        roles: ["Raiding All-Rounder", "Defending All-Rounder"],
      },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Raid Points" },
      { name: "wickets", label: "Tackle Points" },
      { name: "strikeRate", label: "Super Raids" },
      { name: "avgScore", label: "Super Tackles" },
    ],
  },
  hockey: {
    categories: [
      { value: "GOALKEEPER", label: "Goalkeeper", roles: ["Goalkeeper"] },
      {
        value: "DEFENDER", label: "Defender",
        roles: ["Full Back", "Half Back", "Sweeper"],
      },
      {
        value: "MIDFIELDER", label: "Midfielder",
        roles: ["Center Half", "Right Half", "Left Half"],
      },
      {
        value: "FORWARD", label: "Forward",
        roles: ["Center Forward", "Right Wing", "Left Wing", "Inside Right", "Inside Left"],
      },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Goals" },
      { name: "wickets", label: "Assists" },
      { name: "strikeRate", label: "Penalty Corners" },
      { name: "avgScore", label: "Goals Per Game", step: 0.01 },
    ],
  },
  throwball: {
    categories: [
      { value: "THROWER", label: "Thrower", roles: ["Lead Thrower", "Support Thrower"] },
      { value: "CATCHER", label: "Catcher", roles: ["Lead Catcher", "Support Catcher"] },
      { value: "UNIVERSAL", label: "Universal (Both)", roles: ["Universal Player"] },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Points" },
      { name: "wickets", label: "Successful Catches" },
      { name: "strikeRate", label: "Throw Accuracy (%)", step: 0.01 },
      { name: "avgScore", label: "Points Per Match", step: 0.01 },
    ],
  },
  rugby: {
    categories: [
      {
        value: "FORWARD", label: "Forward",
        roles: ["Prop", "Hooker", "Lock", "Flanker", "Number 8"],
      },
      {
        value: "BACK", label: "Back",
        roles: ["Scrum-Half", "Fly-Half", "Center", "Wing", "Full-Back"],
      },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Tries" },
      { name: "wickets", label: "Tackles" },
      { name: "strikeRate", label: "Conversions" },
      { name: "avgScore", label: "Points Per Match", step: 0.01 },
    ],
  },
  generic: {
    categories: [
      { value: "PLAYER", label: "Player", roles: ["Standard Player", "Captain", "Vice Captain"] },
    ],
    stats: [
      { name: "matches", label: "Matches" },
      { name: "runs", label: "Points" },
      { name: "wickets", label: "Assists" },
      { name: "strikeRate", label: "Performance Rate (%)", step: 0.01 },
      { name: "avgScore", label: "Average Score", step: 0.01 },
    ],
  },
};

// ─── Secure-registration config (build-time, optional) ──────────────────────────
// Both gates mirror the backend's config switches. When unset the UI degrades to
// the existing authenticated flow (backend verification is also off by default).
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
const OTP_REQUIRED = import.meta.env.VITE_REGISTRATION_OTP_ENABLED === "true";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RegistrationFormData {
  categoryIds: number[];
  matchTypes: string[];
  matchType: string;
  role: string;
  gender: string;
  dateOfBirth: string;
  age: number;
  matches: number;
  runs: number;
  wickets: number;
  strikeRate: number;
  avgScore: number;
  regType: "self" | "family" | "other";
  playerName: string;
  relation: string;
  flatNumber: string;
  familyMemberId?: number | string;
  partnerUserId?: number | null;
  partnerInfo?: SelectedPartnerInfo | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SportsRegister() {
  const { eventUuid } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission, hasAnyPermission, updateUser } = useAuth();
  const isAnyAdmin = hasAnyPermission(CREATE_EDIT_EVENT_REGISTRATIONS, CREATE_EDIT_SPORTS_MAIN);

  const [event, setEvent] = useState<SportsEvent | null>(null);
  const [categories, setCategories] = useState<PlayerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showEventInfoModal, setShowEventInfoModal] = useState(false);

  // Sibling category events (same sport in same tournament)
  const [siblingEvents, setSiblingEvents] = useState<DashboardEventCard[]>([]);

  // Age proof & Out of age window override state
  const [ageProofFile, setAgeProofFile] = useState<File | null>(null);
  const [ageProofName, setAgeProofName] = useState<string>("");
  const [ageProofError, setAgeProofError] = useState<string>("");
  const ageProofInputRef = useRef<HTMLInputElement | null>(null);

  // Email-OTP verification state.
  const [email, setEmail] = useState(user?.email ?? "");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [liveUser, setLiveUser] = useState<any>(user);

  useEffect(() => {
    userService.getMe().then((me) => {
      setLiveUser(me);
      const userNameVal = me.fullName || "";
      const userGenderVal = me.gender || "";
      const userDobVal = me.dateOfBirth || (me as any).dob || "";
      const rawUserBlock = me.block || (me as any).tower || "";
      const rawUserFlatNum = me.flatNo || (me as any).flatNumber || (me as any).unitNumber || "";
      let userFlatVal = rawUserFlatNum;
      if (rawUserBlock && rawUserFlatNum) {
        if (rawUserFlatNum.toUpperCase().startsWith(rawUserBlock.toUpperCase()) || rawUserFlatNum.toUpperCase().includes(rawUserBlock.toUpperCase())) {
          userFlatVal = rawUserFlatNum;
        } else {
          userFlatVal = `Block ${rawUserBlock}, Flat ${rawUserFlatNum}`;
        }
      } else if (rawUserBlock) {
        userFlatVal = `Block ${rawUserBlock}`;
      }

      if (me.gender || me.dateOfBirth) {
        updateUser({
          gender: me.gender,
          dateOfBirth: me.dateOfBirth || (me as any).dob,
        });
      }

      setFormData(prev => {
        if (prev.regType === "self") {
          const uName = userNameVal || prev.playerName;
          const uGen = userGenderVal || prev.gender;
          const uDob = userDobVal || prev.dateOfBirth;
          const uFlat = userFlatVal || prev.flatNumber;
          const uAge = uDob ? Math.max(0, new Date().getFullYear() - new Date(uDob).getFullYear()) : prev.age;
          return {
            ...prev,
            playerName: uName,
            gender: uGen,
            dateOfBirth: uDob,
            flatNumber: uFlat,
            age: uAge,
          };
        }
        return prev;
      });
    }).catch((err) => {
      console.warn("Could not fetch latest user profile in SportsRegister:", err);
    });
  }, [updateUser]);

  const userFullName = liveUser?.fullName || user?.fullName || "";
  const userGender = liveUser?.gender || user?.gender || "";
  const userDob = liveUser?.dateOfBirth || (liveUser as any)?.dob || user?.dateOfBirth || (user as any)?.dob || "";
  const userBlock = liveUser?.block || (liveUser as any)?.tower || user?.block || (user as any)?.tower || "";
  const rawUserFlat = liveUser?.flatNo || (liveUser as any)?.flatNumber || (liveUser as any)?.unitNumber || user?.flatNo || (user as any)?.flatNumber || (user as any)?.unitNumber || "";

  const userFlat = useMemo(() => {
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
    if (!userFullName?.trim()) missing.push("Full Name");
    if (!userGender?.trim()) missing.push("Gender");
    if (!userDob?.trim()) missing.push("Date of Birth");
    if (!userFlat?.trim()) missing.push("Block & Flat");
    return missing;
  }, [userFullName, userGender, userDob, userFlat]);

  const [formData, setFormData] = useState<RegistrationFormData>({
    categoryIds: [] as number[],
    matchTypes: ["SINGLES"],
    matchType: "SINGLES",
    role: "",
    gender: (user as any)?.gender || "",
    dateOfBirth: (user as any)?.dateOfBirth || (user as any)?.dob || "",
    age: (user as any)?.dateOfBirth || (user as any)?.dob
      ? Math.max(0, new Date().getFullYear() - new Date((user as any)?.dateOfBirth || (user as any)?.dob).getFullYear())
      : 25,
    matches: 0,
    runs: 0,
    wickets: 0,
    strikeRate: 0,
    avgScore: 0,
    regType: "self" as "self" | "family" | "other",
    playerName: user?.fullName || "",
    relation: "",
    flatNumber: (user as any)?.flatNo || (user as any)?.flatNumber || (user as any)?.unitNumber || "",
    familyMemberId: undefined as number | string | undefined,
    partnerUserId: null,
    partnerInfo: null,
  });

  const [savedFamilyMembers, setSavedFamilyMembers] = useState<FamilyMember[]>([]);

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
        name: formData.playerName || userFullName || user?.fullName || "",
        relation: "SELF",
        gender: formData.gender || userGender || "",
        dob: formData.dateOfBirth || userDob || "",
        phone: (liveUser as any)?.phone || user?.phone || "",
        flatNo: formData.flatNumber || userFlat || "",
        gotram: "",
        bloodGroup: "",
      });
    } else if (mode === "family_edit") {
      const targetId = targetMemberId || formData.familyMemberId;
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
          flatNo: userFlat,
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
        flatNo: userFlat,
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
        setFormData(prev => ({
          ...prev,
          playerName: profileModalState.name.trim(),
          gender: profileModalState.gender,
          dateOfBirth: profileModalState.dob,
          flatNumber: profileModalState.flatNo?.trim() || prev.flatNumber,
          age: computedAge,
        }));
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

        const rel = payload.relation.toUpperCase();
        const mappedRel = rel.includes("SPOUSE") || rel.includes("WIFE") || rel.includes("HUSBAND")
          ? "SPOUSE"
          : rel.includes("SON") || rel.includes("DAUGHTER") || rel.includes("CHILD")
          ? "CHILD"
          : rel.includes("FATHER") || rel.includes("MOTHER") || rel.includes("PARENT")
          ? "PARENT"
          : rel.includes("BROTHER") || rel.includes("SIBLING") || rel.includes("SISTER")
          ? "SIBLING"
          : "OTHER";

        setFormData(prev => ({
          ...prev,
          playerName: payload.name,
          gender: payload.gender,
          dateOfBirth: payload.dob,
          relation: mappedRel,
          age: computedAge,
        }));
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

        const rel = payload.relation.toUpperCase();
        const mappedRel = rel.includes("SPOUSE") || rel.includes("WIFE") || rel.includes("HUSBAND")
          ? "SPOUSE"
          : rel.includes("SON") || rel.includes("DAUGHTER") || rel.includes("CHILD")
          ? "CHILD"
          : rel.includes("FATHER") || rel.includes("MOTHER") || rel.includes("PARENT")
          ? "PARENT"
          : rel.includes("BROTHER") || rel.includes("SIBLING") || rel.includes("SISTER")
          ? "SIBLING"
          : "OTHER";

        setFormData(prev => ({
          ...prev,
          playerName: payload.name,
          familyMemberId: saved.id,
          gender: payload.gender,
          dateOfBirth: payload.dob,
          relation: mappedRel,
          age: computedAge,
        }));
        toast.success(`Family member "${payload.name}" added successfully!`);
      }
      setProfileModalState(prev => ({ ...prev, open: false }));
    } catch (err: any) {
      toast.error(err?.message || "Failed to save details");
    } finally {
      setSavingProfileModal(false);
    }
  };

  const familyMembersOnly = savedFamilyMembers.filter((m) => {
    const rel = (m.relation || "").toUpperCase().trim();
    const isSelf =
      rel === "SELF" ||
      rel === "HEAD" ||
      m.id === "self" ||
      m.id === "member-self" ||
      (user?.fullName && m.name.trim().toLowerCase() === user.fullName.trim().toLowerCase());
    return !isSelf;
  });

  useEffect(() => {
    const fetchFamily = async () => {
      try {
        const members = await familyService.getFamilyMembers();
        setSavedFamilyMembers(members);
      } catch (err) {
        console.warn("Could not load family members in SportsRegister:", err);
      }
    };
    fetchFamily();
    window.addEventListener("mana_family_updated", fetchFamily);
    return () => window.removeEventListener("mana_family_updated", fetchFamily);
  }, []);

  // Derived sport config
  const sportKey = detectSport(event?.sport?.name || "");
  const sportConfig = SPORT_CONFIGS[sportKey];

  const eventCategories = event?.categories && event.categories.length > 0 ? event.categories : categories;
  const availableFormats = getEventFormats(event);

  // Sync default matchTypes when event formats load
  useEffect(() => {
    if (event) {
      const formats = getEventFormats(event);
      if (formats.length > 0) {
        setFormData(prev => {
          const validTypes = prev.matchTypes.filter(f => formats.includes(f));
          const newTypes = validTypes.length > 0 ? validTypes : [formats[0]];
          return {
            ...prev,
            matchTypes: newTypes,
            matchType: newTypes[0] || formats[0],
          };
        });
      }
    }
  }, [event]);

  // Auto-select category by default from event
  useEffect(() => {
    if (!eventCategories || eventCategories.length === 0) return;

    setFormData(prev => {
      // If user already has valid selected categories in this event, keep them
      if (prev.categoryIds.length > 0 && prev.categoryIds.some(id => eventCategories.some(c => c.id === id))) {
        return prev;
      }

      // If event has explicitly associated categories:
      if (event?.categories && event.categories.length > 0) {
        if (event.categories.length === 1) {
          return { ...prev, categoryIds: [event.categories[0].id] };
        }

        const matchingCat = event.categories.find(c => {
          const age = prev.age;
          const minOk = c.minAge == null || age >= c.minAge;
          const maxOk = c.maxAge == null || age <= c.maxAge;
          const genderOk = !c.gender || !prev.gender || c.gender.toUpperCase() === prev.gender.toUpperCase() || c.gender.toUpperCase() === "ALL" || c.gender.toUpperCase() === "MIXED";
          return minOk && maxOk && genderOk;
        });

        if (matchingCat) {
          return { ...prev, categoryIds: [matchingCat.id] };
        }

        return { ...prev, categoryIds: [event.categories[0].id] };
      }

      // If generic categories pool, find best match or default to first
      const matchingCat = eventCategories.find(c => {
        const age = prev.age;
        const minOk = c.minAge == null || age >= c.minAge;
        const maxOk = c.maxAge == null || age <= c.maxAge;
        const genderOk = !c.gender || !prev.gender || c.gender.toUpperCase() === prev.gender.toUpperCase() || c.gender.toUpperCase() === "ALL" || c.gender.toUpperCase() === "MIXED";
        return minOk && maxOk && genderOk;
      });

      if (matchingCat) {
        return { ...prev, categoryIds: [matchingCat.id] };
      }

      if (eventCategories.length > 0) {
        return { ...prev, categoryIds: [eventCategories[0].id] };
      }

      return prev;
    });
  }, [event, eventCategories, formData.age, formData.gender]);

  // Toggle format selection (allows selecting both Singles and Doubles, etc.)
  const toggleFormat = (fmt: string) => {
    setFormData(prev => {
      const exists = prev.matchTypes.some(f => f.toUpperCase() === fmt.toUpperCase());
      let updated: string[];
      if (exists) {
        if (prev.matchTypes.length === 1) {
          toast.info("At least one participation format must be selected");
          return prev;
        }
        updated = prev.matchTypes.filter(f => f.toUpperCase() !== fmt.toUpperCase());
      } else {
        updated = [...prev.matchTypes, fmt];
      }
      return {
        ...prev,
        matchTypes: updated,
        matchType: updated[0] || fmt,
      };
    });
  };

  // Get all matching roles for the selected Participant Types + Selected Categories
  const getRolesForSelectedTypeAndCategories = () => {
    const rolesSet = new Set<string>();
    const selectedFormats = (formData.matchTypes && formData.matchTypes.length > 0)
      ? formData.matchTypes
      : [formData.matchType];

    selectedFormats.forEach(fmt => {
      const currentFormat = fmt.toUpperCase();
      const formatCfgCat = sportConfig.categories.find(
        c => c.value.toUpperCase() === currentFormat || currentFormat.includes(c.value.toUpperCase()) || c.value.toUpperCase().includes(currentFormat)
      );

      if (formatCfgCat && formatCfgCat.roles.length > 0) {
        formatCfgCat.roles.forEach(r => rolesSet.add(r));
      }
    });

    if (formData.categoryIds && formData.categoryIds.length > 0) {
      formData.categoryIds.forEach(id => {
        const dbCat = eventCategories.find(c => c.id === id);
        if (!dbCat) return;
        
        const dbCatNameNormalized = dbCat.name.toUpperCase().replace(/[\s']/g, "_");
        
        sportConfig.categories.forEach(cfgCat => {
          const cfgValueNormalized = cfgCat.value.toUpperCase();
          if (dbCatNameNormalized.includes(cfgValueNormalized) || cfgValueNormalized.includes(dbCatNameNormalized)) {
            cfgCat.roles.forEach(r => rolesSet.add(r));
          }
        });
      });
    }

    if (rolesSet.size === 0) {
      sportConfig.categories.forEach(cfgCat => {
        cfgCat.roles.forEach(r => rolesSet.add(r));
      });
    }
    
    return Array.from(rolesSet);
  };

  const availableRoles = getRolesForSelectedTypeAndCategories();

  useEffect(() => {
    const load = async () => {
      try {
        // Links carry the event UUID; tolerate a legacy numeric id as a fallback.
        const fetchEvent = eventUuid && UUID_RE.test(eventUuid)
          ? sportsService.getEventByUuid(eventUuid)
          : sportsService.getEventById(Number(eventUuid));
        const [cats, ev] = await Promise.all([
          sportsService.getCategories(),
          fetchEvent,
        ]);
        setCategories(cats);
        setEvent(ev);
      } catch {
        toast.error("Failed to load registration details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventUuid]);

  // Fetch sibling category events (same sport, same tournament)
  useEffect(() => {
    if (!event?.tournament?.id || !event?.sport?.name) return;
    const tournamentId = event.tournament.id;
    const sportName = event.sport.name;
    sportsDashboardService.getOpenTournaments().then(tournaments => {
      const t = tournaments.find(tr => tr.id === tournamentId);
      if (t) {
        const siblings = t.events.filter(e => e.sportName === sportName);
        setSiblingEvents(siblings);
      }
    }).catch(() => {});
  }, [event?.tournament?.id, event?.sport?.name]);

  // Load Google reCAPTCHA (v2 checkbox) only when a site key is configured.
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    if (document.querySelector('script[data-mana-recaptcha]')) return;
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-mana-recaptcha", "true");
    document.body.appendChild(script);
  }, []);

  // Clear role when category changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, role: "" }));
  }, [formData.categoryIds]);

  useEffect(() => {
    const effectiveDob = liveUser?.dateOfBirth || (liveUser as any)?.dob || (user as any)?.dateOfBirth || (user as any)?.dob;
    const effectiveGender = liveUser?.gender || (user as any)?.gender || "";
    if (formData.regType === "self") {
      let calculatedAge = formData.age;
      if (effectiveDob) {
        const birthDate = new Date(effectiveDob);
        if (!isNaN(birthDate.getTime())) {
          calculatedAge = Math.max(0, new Date().getFullYear() - birthDate.getFullYear());
        }
      }
      setFormData(prev => ({
        ...prev,
        dateOfBirth: effectiveDob || prev.dateOfBirth,
        age: effectiveDob ? calculatedAge : prev.age,
        gender: effectiveGender || prev.gender,
        playerName: user?.fullName || prev.playerName,
      }));
    }
  }, [liveUser, user, formData.regType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === "dateOfBirth") {
      let calculatedAge = formData.age;
      if (value) {
        const birthDate = new Date(value);
        if (!isNaN(birthDate.getTime())) {
          calculatedAge = Math.max(0, new Date().getFullYear() - birthDate.getFullYear());
        }
      }
      setFormData(prev => ({
        ...prev,
        dateOfBirth: value,
        age: calculatedAge,
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleDobChange = (value: string) => {
    let calculatedAge = formData.age;
    if (value) {
      const birthDate = new Date(value);
      if (!isNaN(birthDate.getTime())) {
        calculatedAge = Math.max(0, new Date().getFullYear() - birthDate.getFullYear());
      }
    }
    setFormData(prev => ({
      ...prev,
      dateOfBirth: value,
      age: calculatedAge,
    }));
  };

  const emailValid = isValidEmail(email);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Any edit invalidates a prior verification.
    setEmailVerified(false);
    setOtpSent(false);
    setOtpCode("");
  };

  const sendOtp = async () => {
    if (!emailValid) {
      toast.error("Enter a valid email first");
      return;
    }
    setOtpSending(true);
    try {
      const res = await otpService.send(email.trim(), formData.playerName || user?.fullName);
      if (res.success) {
        setOtpSent(true);
        toast.success(res.message || "Verification code sent");
      } else {
        toast.error(res.message || "Could not send code");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode.trim()) {
      toast.error("Enter the code from your email");
      return;
    }
    setOtpVerifying(true);
    try {
      const res = await otpService.verify(email.trim(), otpCode.trim());
      if (res.verified) {
        setEmailVerified(true);
        toast.success("Email verified");
      } else {
        toast.error(res.message || "Incorrect code");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check user profile for Full Name, Gender, Date of Birth, Flat / Villa
    if (formData.regType === "self") {
      if (!formData.gender?.trim() || !formData.dateOfBirth?.trim() || !formData.playerName?.trim()) {
        toast.error("Please complete your Gender and Date of Birth to proceed with registration.");
        openUpdateDetailsModal("self");
        return;
      }
    } else if (formData.regType === "family") {
      if (!formData.gender?.trim() || !formData.dateOfBirth?.trim() || !formData.playerName?.trim()) {
        toast.error("Please complete Gender and Date of Birth for this family member before registering.");
        openUpdateDetailsModal("family_edit", formData.familyMemberId);
        return;
      }
    }

    if (!formData.dateOfBirth?.trim()) {
      toast.error("Date of Birth is mandatory. Please provide your Date of Birth.");
      openUpdateDetailsModal(formData.regType === "family" ? "family_edit" : "self");
      return;
    }
    if (formData.categoryIds.length === 0) {
      toast.error("Please select at least one category");
      return;
    }
    if (!event?.id) {
      toast.error("Event details are still loading");
      return;
    }
    if (email.trim() && !isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    // Check if participant is registering for an upper-age category requiring DOB proof
    const currentCategoryName = `${event?.categoryName || ""} ${event?.name || ""}`.toLowerCase();
    let currentMinAge: number | null = null;
    let currentMaxAge: number | null = null;
    const underMatch = currentCategoryName.match(/(?:under|u-?|below)\s*(\d+)/i);
    const plusMatch = currentCategoryName.match(/(\d+)\s*(?:\+|plus|above)/i);
    const rangeMatch = currentCategoryName.match(/(\d+)\s*[-–to]\s*(\d+)/i);
    if (underMatch) currentMaxAge = parseInt(underMatch[1], 10);
    else if (plusMatch) currentMinAge = parseInt(plusMatch[1], 10);
    else if (rangeMatch) {
      currentMinAge = parseInt(rangeMatch[1], 10);
      currentMaxAge = parseInt(rangeMatch[2], 10);
    }

    if (formData.age > 0) {
      if (currentMaxAge != null && formData.age > currentMaxAge) {
        toast.error(`Ineligible: Your age (${formData.age}y) exceeds the maximum allowed age (${currentMaxAge}y) for this category.`);
        return;
      }
      if (currentMinAge != null && formData.age < currentMinAge && !ageProofFile) {
        toast.error(`Please upload valid DOB Proof for upper-age category registration (${currentMinAge}+ yrs).`);
        setAgeProofError("Valid Government/School ID with DOB proof is required for upper-age category participation.");
        return;
      }
    }

    if (OTP_REQUIRED && !emailVerified) {
      toast.error("Please verify your email before registering");
      return;
    }

    // Grab the reCAPTCHA token (v2 checkbox) when the widget is configured.
    let recaptchaToken: string | undefined;
    if (RECAPTCHA_SITE_KEY) {
      const grecaptcha = (window as unknown as { grecaptcha?: { getResponse: () => string } }).grecaptcha;
      recaptchaToken = grecaptcha?.getResponse();
      if (!recaptchaToken) {
        toast.error("Please complete the captcha");
        return;
      }
    }

    const selectedFormats = (formData.matchTypes && formData.matchTypes.length > 0)
      ? formData.matchTypes
      : [formData.matchType];

    if (selectedFormats.length === 0) {
      toast.error("Please select at least one participation format");
      return;
    }

    setSubmitting(true);
    try {
      for (const catId of formData.categoryIds) {
        for (const fmt of selectedFormats) {
          const isDoubles = fmt.toUpperCase().includes("DOUBLES");
          await sportsService.registerForEvent({
            eventId: event.id,
            categoryId: catId,
            matchType: fmt,
            role: formData.role,
            age: formData.age,
            dateOfBirth: formData.dateOfBirth,
            matches: formData.matches,
            runs: formData.runs,
            wickets: formData.wickets,
            strikeRate: formData.strikeRate,
            avgScore: formData.avgScore,
            playerName: formData.playerName,
            email: email.trim() || undefined,
            relation: formData.relation,
            flatNumber: formData.flatNumber,
            familyMemberId: formData.regType === "family" ? formData.familyMemberId : undefined,
            partnerUserId: isDoubles && formData.partnerUserId ? formData.partnerUserId : undefined,
            recaptchaToken,
          });
        }
      }

      const formatCount = selectedFormats.length;
      toast.success(event.adminApprovalRequired === false
        ? `Registration confirmed${formatCount > 1 ? ` for ${formatCount} formats` : ""}! Good luck.`
        : `Registration submitted${formatCount > 1 ? ` for ${formatCount} formats` : ""}! You'll be notified once it's approved.`);
      navigate("/sports");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <Loader2 className="w-10 h-10 text-primary animate-spin relative" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading registration details…</p>
      </div>
    );
  }

  const eventDate = event?.eventDateStart
    ? new Date(event.eventDateStart).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;
  const venueName = event?.venue?.name ?? event?.venue?.address;

  // Step indicator
  const completedSteps = [
    formData.playerName.trim().length > 0 && formData.dateOfBirth.trim().length > 0,
    formData.matchTypes.length > 0,
    formData.categoryIds.length > 0,
    formData.role.length > 0,
  ];
  const currentStep = completedSteps.filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-4">
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all group shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-bold uppercase tracking-wider truncate border border-primary/20 flex items-center gap-1.5 shadow-2xs">
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{event?.name || event?.sport?.name || "Event Registration"}</span>
          </span>
          <button
            type="button"
            onClick={() => setShowEventInfoModal(true)}
            aria-label="View Event Details"
            title="View Event Details"
            className="lg:hidden p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Mobile Event Info Modal ────────────────────────────── */}
      {showEventInfoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in lg:hidden"
          onClick={() => setShowEventInfoModal(false)}
        >
          <div 
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/20 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Backgrounds */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4f46e5] opacity-95" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,146,60,0.15),transparent_60%)]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/3" />

            <div className="relative p-5">
              <div className="flex items-center justify-between mb-3.5">
                <button
                  type="button"
                  onClick={() => setShowEventInfoModal(false)}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEventInfoModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-3">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-inner">
                  <Trophy className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {event?.sport?.name && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/20 text-orange-300 text-[10px] font-bold uppercase tracking-wider border border-orange-500/30">
                        {event.sport.name}
                      </span>
                    )}
                    {event?.registrationStatus && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                        {event.registrationStatus}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-white tracking-tight leading-snug">
                    {event?.name ?? "Complete Registration"}
                  </h2>
                  <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                    Fill in your details below to register for this event
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 space-y-2.5">
                {eventDate && (
                  <div className="flex items-center gap-3 text-xs text-white/90 bg-white/5 backdrop-blur-sm border border-white/10 p-2.5 rounded-xl">
                    <span className="text-base">📅</span>
                    <div>
                      <p className="text-[10px] uppercase text-white/50 font-medium">Event Date</p>
                      <p className="font-semibold">{eventDate}</p>
                    </div>
                  </div>
                )}
                {venueName && (
                  <div className="flex items-center gap-3 text-xs text-white/90 bg-white/5 backdrop-blur-sm border border-white/10 p-2.5 rounded-xl">
                    <span className="text-base">📍</span>
                    <div>
                      <p className="text-[10px] uppercase text-white/50 font-medium">Venue Location</p>
                      <p className="font-semibold">{venueName}</p>
                    </div>
                  </div>
                )}
                {event?.community?.name && (
                  <div className="flex items-center gap-3 text-xs text-white/90 bg-white/5 backdrop-blur-sm border border-white/10 p-2.5 rounded-xl">
                    <span className="text-base">🏠</span>
                    <div>
                      <p className="text-[10px] uppercase text-white/50 font-medium">Host Community</p>
                      <p className="font-semibold">{event.community.name}</p>
                    </div>
                  </div>
                )}

                {/* All Sport Categories & Age Details */}
                {siblingEvents.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] uppercase text-white/70 font-bold tracking-wider flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-orange-400" />
                        <span>All {event?.sport?.name || "Sport"} Categories ({siblingEvents.length})</span>
                      </p>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {siblingEvents.map(sib => {
                        const isCurrent = sib.id === event?.id || sib.uuid === eventUuid;
                        const textToScan = `${sib.categoryName || ""} ${sib.name || ""}`.toLowerCase();
                        let ageLabel = "All Ages";
                        const underMatch = textToScan.match(/(?:under|u-?|below)\s*(\d+)/i);
                        const plusMatch = textToScan.match(/(\d+)\s*(?:\+|plus|above)/i);
                        const rangeMatch = textToScan.match(/(\d+)\s*[-–to]\s*(\d+)/i);

                        if (underMatch) ageLabel = `Under ${underMatch[1]} Yrs`;
                        else if (plusMatch) ageLabel = `${plusMatch[1]}+ Yrs`;
                        else if (rangeMatch) ageLabel = `${rangeMatch[1]}–${rangeMatch[2]} Yrs`;

                        return (
                          <div
                            key={sib.id}
                            className={`p-2.5 rounded-xl text-xs space-y-1 border ${
                              isCurrent
                                ? "bg-white/15 border-white/30 text-white shadow-xs"
                                : "bg-white/5 border-white/10 text-white/85"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white text-xs truncate">
                                {sib.categoryName || sib.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-500/80 text-white font-bold uppercase tracking-wider shrink-0">
                                  Current
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/70 pt-0.5">
                              <span>🎯 Age: <strong className="text-orange-300 font-semibold">{ageLabel}</strong></span>
                              {sib.venueName && <span>📍 {sib.venueName}</span>}
                              {sib.eventDateStart && (
                                <span>📅 {format(new Date(sib.eventDateStart), "dd MMM yyyy")}</span>
                              )}
                              {sib.maxParticipants && (
                                <span className="text-white/60">Spots: {sib.maxParticipants} max</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventInfoModal(false)}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all text-center cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── UNIFIED PROFILE / FAMILY MEMBER MODAL ─── */}
      {profileModalState.open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setProfileModalState(prev => ({ ...prev, open: false }))}
        >
          <div
            className="w-full max-w-md bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {profileModalState.mode === "self" ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {profileModalState.mode === "self"
                      ? "Update Your Profile Details"
                      : profileModalState.mode === "family_edit"
                      ? "Update Family Member Details"
                      : "Add New Family Member"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {profileModalState.mode === "self"
                      ? "Required for tournament eligibility & category verification"
                      : "Provide member details for age & category validation"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalState(prev => ({ ...prev, open: false }))}
                className="w-7 h-7 rounded-lg bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProfileModalSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileModalState.name}
                  onChange={(e) => setProfileModalState({ ...profileModalState, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full h-10 text-sm border border-border rounded-xl px-3 bg-muted/40 focus:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              {profileModalState.mode !== "self" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                      Relationship <span className="text-destructive">*</span>
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
                      className="w-full h-10 text-sm border border-border rounded-xl px-2.5 bg-muted/40 focus:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
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
                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                      Gender <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={profileModalState.gender}
                      onChange={(e) => setProfileModalState({ ...profileModalState, gender: e.target.value })}
                      className="w-full h-10 text-sm border border-border rounded-xl px-2.5 bg-muted/40 focus:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
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
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                    Gender <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={profileModalState.gender}
                    onChange={(e) => setProfileModalState({ ...profileModalState, gender: e.target.value })}
                    className="w-full h-10 text-sm border border-border rounded-xl px-2.5 bg-muted/40 focus:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
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
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Date of Birth <span className="text-destructive">*</span>
                  </label>
                  {profileModalState.dob && calculateAge(profileModalState.dob) !== null && (
                    <span className="text-[11px] font-bold px-2 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
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
                  className="h-10 text-sm rounded-xl px-2.5 bg-muted/40 border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileModalState.phone}
                    onChange={(e) => setProfileModalState({ ...profileModalState, phone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full h-10 text-sm border border-border rounded-xl px-3 bg-muted/40 focus:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>

                {profileModalState.mode === "self" ? (
                  <div>
                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                      Flat / Villa No.
                    </label>
                    <input
                      type="text"
                      value={profileModalState.flatNo || ""}
                      onChange={(e) => setProfileModalState({ ...profileModalState, flatNo: e.target.value })}
                      placeholder="e.g. A-402"
                      className="w-full h-10 text-sm border border-border rounded-xl px-3 bg-muted/40 focus:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                      Blood Group
                    </label>
                    <input
                      type="text"
                      value={profileModalState.bloodGroup || ""}
                      onChange={(e) => setProfileModalState({ ...profileModalState, bloodGroup: e.target.value })}
                      placeholder="e.g. O+, B+"
                      className="w-full h-10 text-sm border border-border rounded-xl px-3 bg-muted/40 focus:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setProfileModalState(prev => ({ ...prev, open: false }))}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfileModal}
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
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

      {/* ── 2-Column Responsive Layout ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT COLUMN: Registration Form Controls (7 cols) ──── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Step Indicator */}
          <div className="hidden sm:block bg-card border border-border rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2">
              {["Identity", "Format", "Category", "Role"].map((label, i) => (
                <div key={label} className="flex-1">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${
                    i < currentStep
                      ? "bg-gradient-to-r from-primary to-indigo-400"
                      : i === currentStep
                        ? "bg-primary/40"
                        : "bg-border"
                  }`} />
                  <p className={`text-[10px] mt-1.5 text-center font-medium transition-colors ${
                    i < currentStep ? "text-primary" : i === currentStep ? "text-muted-foreground" : "text-muted-foreground/40"
                  }`}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Registration Type Selector */}
          <div className="bg-card border border-border rounded-xl p-1 flex gap-1 shadow-sm">
            {[
              { key: "self" as const, label: "Register for Self", icon: "👤" },
              { key: "family" as const, label: "Family Member", icon: "👨‍👩‍👧" },
              ...(isAnyAdmin ? [{ key: "other" as const, label: "Community Person", icon: "🏘️" }] : []),
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  regType: tab.key,
                  playerName: tab.key === "self" ? (userFullName || user?.fullName || "") : "",
                  gender: tab.key === "self" ? (userGender || "") : "",
                  dateOfBirth: tab.key === "self" ? (userDob || "") : "",
                  flatNumber: tab.key === "other" ? "" : userFlat,
                  age: tab.key === "self" && userDob ? Math.max(0, new Date().getFullYear() - new Date(userDob).getFullYear()) : prev.age,
                }))}
                className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  formData.regType === tab.key
                    ? "bg-gradient-to-r from-primary to-indigo-500 text-white shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Incomplete Banner */}
            {formData.regType === "self" && missingProfileFields.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-xl flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                      Profile Incomplete: {missingProfileFields.join(", ")} Required
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-0.5 leading-relaxed">
                      Your profile is missing {missingProfileFields.join(", ")}. These details are mandatory in your profile to place you in tournament brackets. Please update your details to proceed.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openUpdateDetailsModal("self")}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                >
                  <span>Update Profile</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {/* 1. Player Identity */}
            <div className="bg-card border border-border rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between gap-2.5 mb-0 md:mb-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Info className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Player Identity</h3>
                    {formData.playerName && (
                      <span className="text-xs font-semibold text-foreground/80 bg-muted px-2.5 py-0.5 rounded-full border border-border">
                        {formData.playerName}
                      </span>
                    )}
                    {formData.age > 0 && (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                        Age: {formData.age} Yrs
                      </span>
                    )}
                  </div>
                  {formData.regType === "self" && (
                    <button
                      type="button"
                      onClick={() => openUpdateDetailsModal("self")}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Edit My Info</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {formData.regType === "family" && (
                  <div className="mt-3 mb-0 md:mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <span>Select Family Member:</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => openUpdateDetailsModal("family_add")}
                        className="px-2.5 py-1 bg-primary text-white hover:bg-primary/90 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Member</span>
                      </button>
                    </div>

                    {familyMembersOnly.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {familyMembersOnly.map((m) => {
                          const isSelected = formData.playerName.trim().toLowerCase() === m.name.trim().toLowerCase();
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
                              onClick={() => {
                                const rel = m.relation?.toUpperCase() || "";
                                const mappedRel = rel.includes("SPOUSE") || rel.includes("WIFE") || rel.includes("HUSBAND")
                                  ? "SPOUSE"
                                  : rel.includes("SON") || rel.includes("DAUGHTER") || rel.includes("CHILD")
                                  ? "CHILD"
                                  : rel.includes("FATHER") || rel.includes("MOTHER") || rel.includes("PARENT")
                                  ? "PARENT"
                                  : rel.includes("BROTHER") || rel.includes("SISTER") || rel.includes("SIBLING")
                                  ? "SIBLING"
                                  : "OTHER";

                                setFormData(prev => {
                                  let calculatedAge = m.age || prev.age;
                                  if (m.dob) {
                                    const birthDate = new Date(m.dob);
                                    if (!isNaN(birthDate.getTime())) {
                                      calculatedAge = Math.max(0, new Date().getFullYear() - birthDate.getFullYear());
                                    }
                                  }
                                  return {
                                    ...prev,
                                    playerName: m.name,
                                    familyMemberId: m.id,
                                    gender: m.gender || "",
                                    dateOfBirth: m.dob || "",
                                    flatNumber: userFlat,
                                    age: calculatedAge,
                                    relation: mappedRel,
                                  };
                                });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border flex-wrap select-none ${
                                isSelected
                                  ? "bg-primary text-white border-primary shadow-xs"
                                  : "bg-card text-foreground border-border hover:border-primary/50"
                              }`}
                            >
                              <span>{m.name}</span>
                              <span className={`text-[10px] font-normal px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                                {m.relation} {formattedDob ? `• DOB: ${formattedDob}` : m.age ? `• (${m.age}y)` : isMissingDetails ? "• ⚠️ Incomplete" : ""}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openUpdateDetailsModal("family_edit", m.id);
                                }}
                                title="Edit details"
                                className={`ml-0.5 p-0.5 rounded text-[11px] transition ${
                                  isSelected ? "hover:bg-white/20 text-white" : "hover:bg-muted text-muted-foreground"
                                }`}
                              >
                                ✏️
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-dashed border-border">
                        <span>No family members added yet. Click &quot;Add Member&quot; to add family members to your directory.</span>
                      </div>
                    )}

                    {formData.regType === "family" && formData.playerName && (!formData.gender || !formData.dateOfBirth) && (
                      <div className="mt-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-left animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                            Missing {(!formData.gender && !formData.dateOfBirth) ? "Gender & Date of Birth" : !formData.gender ? "Gender" : "Date of Birth"} for {formData.playerName}.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openUpdateDetailsModal("family_edit", formData.familyMemberId)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                        >
                          <span>Update Member</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="hidden md:grid grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Player Name */}
                  <div className="space-y-1.5 sm:space-y-2 col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 truncate">
                      Player Name
                    </label>
                    <input
                      name="playerName"
                      type="text"
                      value={formData.playerName}
                      onChange={handleInputChange}
                      readOnly={formData.regType === "self"}
                      placeholder={formData.regType === "self" ? "" : "Enter full name"}
                      className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 sm:py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                        formData.regType === "self"
                          ? "text-muted-foreground cursor-not-allowed opacity-70"
                          : "text-foreground"
                      }`}
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5 sm:space-y-2 col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between truncate">
                      <span className="flex items-center gap-1.5 truncate">
                        <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                        Gender <span className="text-destructive font-bold">*</span>
                      </span>
                      {formData.regType === "self" && (
                        <button
                          type="button"
                          onClick={() => openUpdateDetailsModal("self")}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{!userGender ? "⚠️ Add" : "Edit"}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </label>
                    {formData.regType === "self" ? (
                      <div className={`w-full border rounded-lg px-3 py-2 sm:py-2.5 text-sm flex items-center justify-between ${
                        userGender ? "bg-muted/50 border-border text-foreground" : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
                      }`}>
                        <span className="font-medium truncate">{userGender ? userGender.toUpperCase() : "Missing"}</span>
                        {!userGender && (
                          <button
                            type="button"
                            onClick={() => openUpdateDetailsModal("self")}
                            className="text-xs font-bold text-amber-600 hover:underline cursor-pointer ml-1"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    ) : (
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 sm:py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      >
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    )}
                  </div>

                  {/* Primary Role */}
                  <div className="space-y-1.5 sm:space-y-2 col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate block">
                      Primary Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 sm:py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                    >
                      <option value="">Select Role</option>
                      {availableRoles.map((r: string) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date of Birth (Mandatory) */}
                  <div className="space-y-1.5 sm:space-y-2 col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between truncate">
                      <span className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>DOB <span className="text-destructive font-bold">*</span></span>
                      </span>
                      {formData.regType === "self" && (
                        <button
                          type="button"
                          onClick={() => openUpdateDetailsModal("self")}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{!userDob ? "⚠️ Add" : "Edit"}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </label>
                    {formData.regType === "self" ? (
                      <div className={`w-full border rounded-lg px-3 py-2 sm:py-2.5 text-sm flex items-center justify-between ${
                        userDob ? "bg-muted/50 border-border text-foreground" : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
                      }`}>
                        <span className="font-medium truncate">
                          {userDob ? format(new Date(userDob), "dd MMM yyyy") : "Missing"}
                        </span>
                        {!userDob && (
                          <button
                            type="button"
                            onClick={() => openUpdateDetailsModal("self")}
                            className="text-xs font-bold text-amber-600 hover:underline cursor-pointer ml-1"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    ) : (
                      <DatePicker
                        value={formData.dateOfBirth}
                        onChange={handleDobChange}
                        max={new Date().toISOString().split("T")[0]}
                        presets={false}
                        placeholder="Pick DOB"
                      />
                    )}
                  </div>

                  {/* Flat Number */}
                  <div className="space-y-1.5 sm:space-y-2 col-span-1 animate-in fade-in slide-in-from-top-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between truncate">
                      <span>Block & Flat <span className="text-destructive font-bold">*</span></span>
                      {!userFlat && (
                        <button
                          type="button"
                          onClick={() => openUpdateDetailsModal("self")}
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>⚠️ Add</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </label>
                    <input
                      name="flatNumber"
                      type="text"
                      value={formData.regType === "other" ? formData.flatNumber : (userFlat || formData.flatNumber)}
                      onChange={handleInputChange}
                      readOnly={formData.regType === "self" || formData.regType === "family"}
                      placeholder={userFlat || "Missing in Profile"}
                      className={`w-full border rounded-lg px-3 py-2 sm:py-2.5 text-sm transition-all duration-200 ${
                        formData.regType !== "other"
                          ? userFlat
                            ? "bg-muted/50 border-border text-muted-foreground cursor-not-allowed opacity-70"
                            : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
                          : "bg-muted/50 border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Participant Type (Format) */}
            {availableFormats.length === 1 ? (
              <div className="bg-card border border-border rounded-xl p-3 sm:p-3.5 shadow-sm flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Participant Type:</h3>
                </div>
                <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs sm:text-sm font-bold capitalize">
                  {availableFormats[0].replace(/_/g, " ").toLowerCase()}
                </span>
              </div>
            ) : availableFormats.length > 1 ? (
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-2.5 mb-3.5 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Participant Type</h3>
                      <span className="text-xs text-muted-foreground font-normal">
                        — Choose one or more formats
                      </span>
                    </div>
                    {formData.matchTypes.length > 1 && (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        {formData.matchTypes.length} Formats Selected
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableFormats.map((fmt) => {
                      const isSelected = formData.matchTypes.some(f => f.toUpperCase() === fmt.toUpperCase());
                      const formatLabel = fmt.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => toggleFormat(fmt)}
                          className={`group relative px-3.5 py-2 rounded-lg border-2 text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer select-none ${
                            isSelected
                              ? "bg-gradient-to-r from-primary to-indigo-500 border-primary text-white shadow-sm shadow-primary/20"
                              : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:shadow-xs"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isSelected ? "bg-white/20 border-white text-white" : "border-muted-foreground/40 group-hover:border-primary"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{formatLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {/* 2b. Partner Nomination for Doubles / Mixed Doubles */}
            {formData.matchTypes.some(f => f.toUpperCase().includes("DOUBLES")) && (
              <SportsPartnerSelector
                selectedPartner={formData.partnerInfo}
                onChange={(partner) => {
                  setFormData(prev => ({
                    ...prev,
                    partnerInfo: partner,
                    partnerUserId: partner?.userId || null,
                  }));
                }}
                matchType={formData.matchTypes.find(f => f.toUpperCase().includes("DOUBLES")) || "DOUBLES"}
                currentGender={formData.gender}
                currentUserId={user?.id}
                communityId={user?.communityId}
                familyMembers={savedFamilyMembers}
                disabled={submitting}
              />
            )}

            {/* Sport Categories in Tournament */}
            {siblingEvents.length > 1 && (
              <div className="bg-card border border-border rounded-xl p-3 sm:p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Trophy className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">Select Category</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {siblingEvents.length} categories available for {event?.sport?.name}
                      </p>
                    </div>
                  </div>
                  {formData.age > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Participant Age: {formData.age} Yrs
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {siblingEvents.map(sib => {
                    const isCurrentEvent = sib.id === event?.id || sib.uuid === eventUuid;
                    const isRegistered = sib.myRegistrationId != null;

                    // Parse age bracket from category name or event name (e.g., "19+ Men", "Under 14", "Age: 20-35")
                    const textToScan = `${sib.categoryName || ""} ${sib.name || ""}`.toLowerCase();
                    let minAge: number | null = null;
                    let maxAge: number | null = null;

                    const underMatch = textToScan.match(/(?:under|u-?|below)\s*(\d+)/i);
                    const plusMatch = textToScan.match(/(\d+)\s*(?:\+|plus|above)/i);
                    const rangeMatch = textToScan.match(/(\d+)\s*[-–to]\s*(\d+)/i);

                    if (underMatch) {
                      maxAge = parseInt(underMatch[1], 10);
                    } else if (plusMatch) {
                      minAge = parseInt(plusMatch[1], 10);
                    } else if (rangeMatch) {
                      minAge = parseInt(rangeMatch[1], 10);
                      maxAge = parseInt(rangeMatch[2], 10);
                    }

                    const userAge = formData.age;
                    let isUnderAge = false;
                    let isOverAge = false;
                    let warningMsg = "";

                    if (userAge > 0) {
                      if (maxAge != null && userAge > maxAge) {
                        isOverAge = true;
                        warningMsg = `Your age (${userAge}y) exceeds the maximum limit for this category (Max: ${maxAge} yrs). Not eligible to select.`;
                      } else if (minAge != null && userAge < minAge) {
                        isUnderAge = true;
                        warningMsg = `Your age (${userAge}y) is below the standard minimum (${minAge}+ yrs). Upper category selection requires valid Date of Birth (DOB) proof verification.`;
                      }
                    }

                    const isBlocked = isOverAge; // Over-age participants strictly cannot participate in junior/under-age events

                    return (
                      <div
                        key={sib.id}
                        className={`rounded-xl border transition-all p-3 ${
                          isCurrentEvent
                            ? "border-primary bg-primary/5 shadow-sm"
                            : isRegistered
                              ? "border-emerald-200 bg-emerald-50/30"
                              : isBlocked
                                ? "border-rose-200 bg-rose-50/20 opacity-75 cursor-not-allowed"
                                : isUnderAge
                                  ? "border-amber-200 bg-amber-50/20 hover:border-amber-400 cursor-pointer"
                                  : "border-border hover:border-primary/30 hover:bg-muted/30 cursor-pointer"
                        }`}
                        onClick={() => {
                          if (isCurrentEvent || isRegistered) return;
                          if (isBlocked) {
                            toast.error(`Ineligible Category: ${warningMsg}`);
                            return;
                          }
                          if (isUnderAge) {
                            toast.warning(`Notice: ${warningMsg}`);
                          }
                          navigate(`/sports/register/${sib.uuid ?? sib.id}`, { replace: true });
                        }}
                        role={!isCurrentEvent && !isRegistered && !isBlocked ? "button" : undefined}
                        tabIndex={!isCurrentEvent && !isRegistered && !isBlocked ? 0 : undefined}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isCurrentEvent ? "bg-primary" : isRegistered ? "bg-emerald-500" : isBlocked ? "bg-rose-400" : isUnderAge ? "bg-amber-500" : "bg-muted-foreground/30"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-semibold ${isCurrentEvent ? "text-primary font-bold" : "text-foreground"}`}>
                                  {sib.categoryName || sib.name}
                                </span>
                                {minAge != null && maxAge != null ? (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                                    {minAge}–{maxAge} Yrs
                                  </span>
                                ) : minAge != null ? (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                                    {minAge}+ Yrs
                                  </span>
                                ) : maxAge != null ? (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                                    Under {maxAge} Yrs
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {sib.venueName && <span className="text-[10px] text-muted-foreground">{sib.venueName}</span>}
                                {sib.maxParticipants && <span className="text-[10px] text-primary font-medium">{sib.maxParticipants} max spots</span>}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {isCurrentEvent ? (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary shrink-0 border border-primary/20">
                                Selected
                              </span>
                            ) : isRegistered ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                                ✓ {sib.myRegistrationStatus === "CONFIRMED" ? "Confirmed" : "Registered"}
                              </span>
                            ) : isBlocked ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shrink-0 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Not Eligible
                              </span>
                            ) : isUnderAge ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 shrink-0 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Proof Needed
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                                Tap to select
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── DOB Proof Upload for Out-of-Age / Upper Age Category Selection ── */}
                {(() => {
                  const currentCategoryName = `${event?.categoryName || ""} ${event?.name || ""}`.toLowerCase();
                  let currentMinAge: number | null = null;
                  const plusMatch = currentCategoryName.match(/(\d+)\s*(?:\+|plus|above)/i);
                  const rangeMatch = currentCategoryName.match(/(\d+)\s*[-–to]\s*(\d+)/i);
                  if (plusMatch) currentMinAge = parseInt(plusMatch[1], 10);
                  else if (rangeMatch) currentMinAge = parseInt(rangeMatch[1], 10);

                  const isUpperCategory = formData.age > 0 && currentMinAge != null && formData.age < currentMinAge;

                  if (!isUpperCategory) return null;

                  return (
                    <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2.5 animate-fade-in">
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-lg shrink-0 mt-0.5">
                          <FileUp className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                            Valid DOB Proof Required for Upper Age Category
                          </h4>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                            Participant age ({formData.age} yrs) is under the standard age window ({currentMinAge}+ yrs). Please upload a valid Government/School ID with Date of Birth proof (Aadhaar, Passport, Birth Certificate, etc.) for tournament committee verification.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <input
                          ref={ageProofInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("File size must be under 5MB");
                                setAgeProofError("File size must be under 5MB");
                                return;
                              }
                              setAgeProofFile(file);
                              setAgeProofName(file.name);
                              setAgeProofError("");
                              toast.success(`Attached DOB proof: ${file.name}`);
                            }
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => ageProofInputRef.current?.click()}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{ageProofName ? "Change DOB Proof" : "Upload DOB Proof"}</span>
                        </button>

                        {ageProofName ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-semibold truncate max-w-[200px]">{ageProofName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setAgeProofFile(null);
                                setAgeProofName("");
                                if (ageProofInputRef.current) ageProofInputRef.current.value = "";
                              }}
                              className="text-slate-400 hover:text-slate-600 ml-1 cursor-pointer"
                              title="Remove attachment"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium">
                            * Supported: PDF, JPG, PNG (Max 5MB)
                          </span>
                        )}
                      </div>
                      {ageProofError && (
                        <p className="text-[11px] text-rose-600 font-semibold">{ageProofError}</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}



            {/* 4. Career Statistics */}
            <div className="hidden sm:block bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-sm">📊</span>
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Career Statistics</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sportConfig.stats.map(stat => (
                  <div key={stat.name} className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{stat.label}</label>
                    <input
                      name={stat.name}
                      type="number"
                      step={stat.step ?? 1}
                      value={formData[stat.name]}
                      onChange={handleInputChange}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Email Verification (optional) */}
            {OTP_REQUIRED && (
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Verify Email</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 md:items-end">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        readOnly={emailVerified}
                        placeholder="you@example.com"
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 disabled:opacity-60"
                      />
                    </div>
                    {!emailVerified && (
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={!emailValid || otpSending}
                        className="h-[46px] px-5 bg-muted border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted/80 disabled:opacity-50 transition-all whitespace-nowrap"
                      >
                        {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : otpSent ? "Resend code" : "Send code"}
                      </button>
                    )}
                  </div>

                  {emailVerified ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" /> Email verified successfully
                    </div>
                  ) : otpSent && (
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 md:items-end animate-in fade-in slide-in-from-top-1">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Enter Code</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="6-digit code"
                          className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={verifyOtp}
                        disabled={otpVerifying || !otpCode.trim()}
                        className="h-[46px] px-6 bg-primary hover:bg-primary/90 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all whitespace-nowrap shadow-sm shadow-primary/20"
                      >
                        {otpVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* reCAPTCHA */}
            {RECAPTCHA_SITE_KEY && (
              <div className="flex justify-center py-2">
                <div className="g-recaptcha" data-sitekey={RECAPTCHA_SITE_KEY}></div>
              </div>
            )}

            {/* Missing Gender/DOB Alert */}
            {(!formData.gender?.trim() || !formData.dateOfBirth?.trim()) && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-left animate-in fade-in shadow-2xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                    Registration is disabled. Please provide {(!formData.gender?.trim() && !formData.dateOfBirth?.trim()) ? "Gender and Date of Birth" : !formData.gender?.trim() ? "Gender" : "Date of Birth"} to proceed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openUpdateDetailsModal(formData.regType === "family" ? (formData.familyMemberId ? "family_edit" : "family_add") : "self", formData.familyMemberId)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 whitespace-nowrap"
                >
                  <span>Provide Details</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Submit Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 py-3 bg-card border border-border rounded-xl text-sm text-muted-foreground font-semibold hover:bg-muted/50 hover:text-foreground transition-all duration-200"
              >
                ← Go Back
              </button>
              <button
                type="submit"
                disabled={submitting || (OTP_REQUIRED && !emailVerified) || !formData.gender?.trim() || !formData.dateOfBirth?.trim()}
                className="flex-[2] py-3 bg-gradient-to-r from-primary via-indigo-500 to-violet-500 hover:from-primary/90 hover:via-indigo-500/90 hover:to-violet-500/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                ) : !formData.gender?.trim() || !formData.dateOfBirth?.trim() ? (
                  <>Provide Gender &amp; DOB to Register</>
                ) : (
                  <>Submit Registration <span className="text-lg">→</span></>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── RIGHT COLUMN: Sticky Event Summary Card (5 cols) ──── */}
        <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-6">
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-white/10">
            {/* Gradient Backgrounds */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4f46e5] opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,146,60,0.15),transparent_60%)]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/3" />

            <div className="relative p-4 md:p-5">
              <button
                onClick={() => navigate(-1)}
                className="mb-3 flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back
              </button>

              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {event?.sport?.name && (
                      <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 text-[10px] font-bold uppercase tracking-wider">
                        {event.sport.name}
                      </span>
                    )}
                    {event?.registrationStatus && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                        {event.registrationStatus}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                    {event?.name ?? "Complete Registration"}
                  </h2>
                  <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                    Fill in your details below to register for this event
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                {eventDate && (
                  <div className="flex items-center gap-2.5 text-xs text-white/90 bg-white/5 backdrop-blur-sm border border-white/10 p-2.5 rounded-xl">
                    <span className="text-base">📅</span>
                    <div>
                      <p className="text-[10px] uppercase text-white/50 font-medium">Event Date</p>
                      <p className="font-semibold">{eventDate}</p>
                    </div>
                  </div>
                )}
                {venueName && (
                  <div className="flex items-center gap-2.5 text-xs text-white/90 bg-white/5 backdrop-blur-sm border border-white/10 p-2.5 rounded-xl">
                    <span className="text-base">📍</span>
                    <div>
                      <p className="text-[10px] uppercase text-white/50 font-medium">Venue Location</p>
                      <p className="font-semibold">{venueName}</p>
                    </div>
                  </div>
                )}
                {event?.community?.name && (
                  <div className="flex items-center gap-2.5 text-xs text-white/90 bg-white/5 backdrop-blur-sm border border-white/10 p-2.5 rounded-xl">
                    <span className="text-base">🏠</span>
                    <div>
                      <p className="text-[10px] uppercase text-white/50 font-medium">Host Community</p>
                      <p className="font-semibold">{event.community.name}</p>
                    </div>
                  </div>
                )}

                {/* All Sport Categories & Age Details */}
                {siblingEvents.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <p className="text-[11px] uppercase text-white/70 font-bold tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-orange-400" />
                      <span>All {event?.sport?.name || "Sport"} Categories ({siblingEvents.length})</span>
                    </p>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {siblingEvents.map(sib => {
                        const isCurrent = sib.id === event?.id || sib.uuid === eventUuid;
                        const textToScan = `${sib.categoryName || ""} ${sib.name || ""}`.toLowerCase();
                        let ageLabel = "All Ages";
                        const underMatch = textToScan.match(/(?:under|u-?|below)\s*(\d+)/i);
                        const plusMatch = textToScan.match(/(\d+)\s*(?:\+|plus|above)/i);
                        const rangeMatch = textToScan.match(/(\d+)\s*[-–to]\s*(\d+)/i);

                        if (underMatch) ageLabel = `Under ${underMatch[1]} Yrs`;
                        else if (plusMatch) ageLabel = `${plusMatch[1]}+ Yrs`;
                        else if (rangeMatch) ageLabel = `${rangeMatch[1]}–${rangeMatch[2]} Yrs`;

                        return (
                          <div
                            key={sib.id}
                            className={`p-2.5 rounded-xl text-xs space-y-1 border ${
                              isCurrent
                                ? "bg-white/15 border-white/30 text-white shadow-xs"
                                : "bg-white/5 border-white/10 text-white/85"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white text-xs truncate">
                                {sib.categoryName || sib.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-500/80 text-white font-bold uppercase tracking-wider shrink-0">
                                  Current
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/70 pt-0.5">
                              <span>🎯 Age: <strong className="text-orange-300 font-semibold">{ageLabel}</strong></span>
                              {sib.venueName && <span>📍 {sib.venueName}</span>}
                              {sib.eventDateStart && (
                                <span>📅 {format(new Date(sib.eventDateStart), "dd MMM yyyy")}</span>
                              )}
                              {sib.maxParticipants && (
                                <span className="text-white/60">Spots: {sib.maxParticipants} max</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
