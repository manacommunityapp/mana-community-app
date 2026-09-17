import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Loader2, ArrowLeft, CheckCircle2, Trophy,
  Calendar, Sparkles, Check, AlertCircle,
  Users, User, MapPin, ShieldCheck, ListChecks, Info, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { sportsService } from "../../../services/sports/sportsService";
import { sportsDashboardService, type DashboardTournamentCard } from "../../../services/sports/sportsDashboardService";
import { familyService, type FamilyMember } from "../../../services/common/familyService";
import { userService } from "../../../services/common/userService";
import { useAuth } from "../../../contexts/AuthContext";
import { DatePicker } from "../ui/date-picker";
import { format } from "date-fns";
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
  if (!cat) return { eligible: true };

  // Age validation
  if (age !== null) {
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
  }

  // Gender validation
  if (gender && cat.gender && cat.gender.toUpperCase() !== "ALL") {
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

function findBestEligibleCategory(
  categories: PlayerCategory[],
  sportName: string,
  age: number | null,
  gender: string
): PlayerCategory | undefined {
  if (!categories || categories.length === 0) return undefined;
  const sportKey = detectSport(sportName);

  // 1. Fully eligible & sport-name matched
  const eligibleSport = categories.filter(c => {
    const el = checkCategoryEligibility(c, age, gender);
    const matchesSport = c.name.toLowerCase().includes(sportKey) || sportKey.includes(c.name.toLowerCase());
    return el.eligible && matchesSport;
  });
  if (eligibleSport.length > 0) return eligibleSport[0];

  // 2. Any fully eligible category
  const allEligible = categories.filter(c => checkCategoryEligibility(c, age, gender).eligible);
  if (allEligible.length > 0) {
    // Prefer open/general/men/women/adult
    const openCat = allEligible.find(c =>
      c.name.toLowerCase().includes("open") ||
      c.name.toLowerCase().includes("general") ||
      c.name.toLowerCase().includes("adult")
    );
    return openCat || allEligible[0];
  }

  // 3. Fallback: match sport name
  const sportMatched = categories.find(c =>
    c.name.toLowerCase().includes(sportKey) || sportKey.includes(c.name.toLowerCase())
  );
  return sportMatched || categories[0];
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
      { value: "SINGLES", label: "Singles", roles: ["Men's Singles", "Women's Singles"] },
      { value: "DOUBLES", label: "Doubles", roles: ["Men's Doubles", "Women's Doubles"] },
      { value: "MIXED_DOUBLES", label: "Mixed Doubles", roles: ["Mixed Doubles"] },
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
  role: string;
  categoryId?: number;
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
  const [regType, setRegType] = useState<"self" | "family">("self");
  const [playerName, setPlayerName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [gender, setGender] = useState((user as any)?.gender || "");
  const [dateOfBirth, setDateOfBirth] = useState((user as any)?.dateOfBirth || (user as any)?.dob || "");
  const [relation, setRelation] = useState("");
  const [flatNumber, setFlatNumber] = useState((user as any)?.flatNumber || (user as any)?.unitNumber || "");
  const [familyMemberId, setFamilyMemberId] = useState<number | string | undefined>();
  const [savedFamilyMembers, setSavedFamilyMembers] = useState<FamilyMember[]>([]);

  // Validation errors
  const [formErrors, setFormErrors] = useState<{ playerName?: string; gender?: string; dateOfBirth?: string }>({});
  const [eventErrors, setEventErrors] = useState<Record<number, string>>({});

  const currentAge = useMemo(() => calculateAge(dateOfBirth), [dateOfBirth]);

  // Load user profile & family members
  useEffect(() => {
    userService.getMe().then((me) => {
      if (me.gender || me.dateOfBirth || (me as any).flatNumber || (me as any).unitNumber) {
        updateUser({
          gender: me.gender,
          dateOfBirth: me.dateOfBirth || (me as any).dob,
        });
        if (!gender) setGender(me.gender || "");
        if (!dateOfBirth) setDateOfBirth(me.dateOfBirth || (me as any).dob || "");
        if (!flatNumber) setFlatNumber((me as any).flatNumber || (me as any).unitNumber || "");
      }
    }).catch((err) => {
      console.warn("Could not fetch latest user profile:", err);
    });

    familyService.getFamilyMembers().then(setSavedFamilyMembers).catch(() => {});
  }, [updateUser]);

  // Load tournament and open events
  useEffect(() => {
    const fetchTournamentData = async () => {
      setLoading(true);
      try {
        const [openTourneys, cats] = await Promise.all([
          sportsDashboardService.getOpenTournaments(),
          sportsService.getCategories(),
        ]);
        setCategories(cats);

        const targetTourney = openTourneys.find(t => String(t.id) === String(tournamentId));
        if (targetTourney) {
          setTournament(targetTourney);
          const initialAge = calculateAge(dateOfBirth);

          const initialSelections: SportEventSelection[] = targetTourney.events.map(ev => {
            const sportKey = detectSport(ev.sportName || ev.name);
            const cfg = SPORT_CONFIGS[sportKey] || SPORT_CONFIGS.generic;
            const defaultRole = cfg.categories[0]?.roles[0] || "Player";
            const isAlreadyRegistered = Boolean(ev.myRegistrationId);

            // Find best eligible category for participant
            const bestCat = findBestEligibleCategory(cats, ev.sportName || ev.name, initialAge, gender);

            return {
              eventId: ev.id,
              uuid: ev.uuid ?? undefined,
              name: ev.name,
              sportName: ev.sportName || "Sports",
              categoryName: ev.categoryName || undefined,
              venueName: ev.venueName || undefined,
              eventDateStart: ev.eventDateStart || undefined,
              eventDateEnd: ev.eventDateEnd || undefined,
              isRegistered: isAlreadyRegistered,
              selected: !isAlreadyRegistered, // Pre-select all un-registered events
              matchType: "SINGLES",
              role: defaultRole,
              categoryId: bestCat?.id,
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
      const currentCat = categories.find(c => c.id === ev.categoryId);
      const isEligible = checkCategoryEligibility(currentCat, age, gender).eligible;

      // If current category is ineligible or not set, switch to best eligible category
      if (!isEligible) {
        const best = findBestEligibleCategory(categories, ev.sportName || ev.name, age, gender);
        if (best && best.id !== ev.categoryId) {
          return { ...ev, categoryId: best.id };
        }
      }
      return ev;
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
      setPlayerName(user?.fullName || "");
      setEmail(user?.email || "");
      setGender((user as any)?.gender || "");
      setDateOfBirth((user as any)?.dateOfBirth || (user as any)?.dob || "");
      setRelation("");
      setFamilyMemberId(undefined);
    } else {
      if (savedFamilyMembers.length > 0) {
        const first = savedFamilyMembers[0];
        setPlayerName(first.name);
        setEmail(first.email || "");
        setGender(first.gender || "");
        setDateOfBirth(first.dateOfBirth || "");
        setRelation(first.relationship || "");
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
    const member = savedFamilyMembers.find(m => String(m.id) === String(memberId));
    if (member) {
      setPlayerName(member.name);
      setEmail(member.email || "");
      setGender(member.gender || "");
      setDateOfBirth(member.dateOfBirth || "");
      setRelation(member.relationship || "");
      setFamilyMemberId(member.id);
      setFormErrors({});
      setEventErrors({});
    }
  };

  const toggleEventSelection = (eventId: number) => {
    setEventSelections(prev => prev.map(ev => {
      if (ev.eventId === eventId) {
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
        return { ...ev, [field]: value };
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

  const selectedEvents = useMemo(() => {
    return eventSelections.filter(e => e.selected && !e.isRegistered);
  }, [eventSelections]);

  const selectedCount = selectedEvents.length;

  const selectAll = () => {
    setEventSelections(prev => prev.map(e => e.isRegistered ? e : { ...e, selected: true }));
  };

  const deselectAll = () => {
    setEventSelections(prev => prev.map(e => ({ ...e, selected: false })));
  };

  // Comprehensive Submission Handler with Client-Side Eligibility Validation
  const handleSubmit = async () => {
    const errors: { playerName?: string; gender?: string; dateOfBirth?: string } = {};
    if (!playerName.trim()) errors.playerName = "Participant name is required";
    if (!gender) errors.gender = "Gender is required";
    if (!dateOfBirth) errors.dateOfBirth = "Date of birth is mandatory for category validation";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please complete the required participant information");
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
      try {
        const catId = ev.categoryId || categories[0]?.id || 1;
        await sportsService.registerForEvent({
          eventId: ev.eventId,
          categoryId: catId,
          matchType: ev.matchType || "SINGLES",
          role: ev.role || "Player",
          age: calculatedAge,
          dateOfBirth: dateOfBirth,
          playerName: playerName.trim(),
          email: email.trim() || undefined,
          relation: relation || undefined,
          flatNumber: flatNumber || undefined,
          familyMemberId: regType === "family" ? familyMemberId : undefined,
        });
        successCount++;
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || err?.message || `Failed to register for ${ev.name}`;
        submissionErrors[ev.eventId] = errMsg;
        console.error(`Failed to register for ${ev.name}:`, err);
        failedCount++;
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
      toast.warning(`Registered for ${successCount} event(s), but ${failedCount} event(s) failed. See errors below.`);
    } else {
      const firstErrMsg = Object.values(submissionErrors)[0] || "Registration failed. Please check the requirements.";
      toast.error(firstErrMsg);
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
          <h4 className="text-sm font-bold text-slate-800">Loading Tournament Details</h4>
          <p className="text-xs text-slate-500 mt-0.5">Fetching events and categories...</p>
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
        <h3 className="text-base font-bold text-slate-900 mb-1">Tournament Not Available</h3>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          This tournament does not have open events or registrations have closed.
        </p>
        <button
          onClick={() => navigate("/sports")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-md shadow-indigo-500/20 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Sports Hub
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* ── Top Navigation Bar with Tournament Title ──────────────────── */}
      <div className="flex items-center justify-between gap-3 bg-white p-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200/80 shadow-xs">
        <button
          onClick={() => navigate("/sports")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back to Hub</span>
          <span className="sm:hidden">Back</span>
        </button>

        <div className="flex items-center gap-2 min-w-0 px-2 text-center">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Trophy className="h-3.5 w-3.5 text-white" />
          </div>
          <h4 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 truncate">
            {tournament.name}
          </h4>
          {tournament.events && (
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-semibold shrink-0">
              {tournament.events.length} sports
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-3 h-3 text-indigo-500 animate-spin-slow" />
            <span className="hidden sm:inline">Multi-Sport Registration</span>
            <span className="sm:hidden">Registration</span>
          </span>
        </div>
      </div>

      {/* ── Main Layout: Participant Info (Col 4) & Sports Selection (Col 8) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ── Left Column: Participant Information (4 cols) ─────────── */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-2xs">1</span>
                Participant Details
              </h2>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Required</span>
            </div>

            {/* Self vs Family Member Toggle */}
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100/90 rounded-lg mb-3 text-xs">
              <button
                type="button"
                onClick={() => handleRegTypeChange("self")}
                className={`py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer font-semibold ${
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
                className={`py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer font-semibold ${
                  regType === "family"
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Family</span>
              </button>
            </div>

            {/* Quick Family Member Pills */}
            {regType === "family" && savedFamilyMembers.length > 0 && (
              <div className="mb-3 p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-indigo-900 mb-1.5">
                  Select Family Member:
                </label>
                <div className="flex flex-wrap gap-1">
                  {savedFamilyMembers.map((m) => {
                    const isSelected = String(familyMemberId) === String(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleFamilyMemberSelect(m.id)}
                        className={`text-[11px] px-2 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer border ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <span>{m.name}</span>
                        {m.relationship && (
                          <span className={`text-[9px] px-1 py-0.2 rounded font-normal ${isSelected ? "bg-indigo-700/60 text-indigo-100" : "bg-slate-100 text-slate-500"}`}>
                            {m.relationship}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-2.5">
              {/* Row 1: Full Name & Email in single line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
                <div className="min-w-0">
                  <div className="flex items-center justify-between h-4 mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => {
                      setPlayerName(e.target.value);
                      if (formErrors.playerName) setFormErrors(p => ({ ...p, playerName: undefined }));
                    }}
                    placeholder="Participant's full name"
                    className={`w-full h-8.5 text-xs border rounded-lg px-2.5 bg-slate-50/50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 transition shadow-2xs ${
                      formErrors.playerName
                        ? "border-rose-400 focus:ring-rose-400/20 focus:border-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                    }`}
                  />
                  {formErrors.playerName && (
                    <p className="text-[10px] text-rose-600 font-medium mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.playerName}
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between h-4 mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Email Address
                    </label>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-8.5 text-xs border border-slate-200 rounded-lg px-2.5 bg-slate-50/50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 2: Gender, DOB and Flat in single line */}
              <div className="grid grid-cols-3 gap-2 items-start">
                <div className="min-w-0">
                  <div className="flex items-center justify-between h-4 mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <select
                    value={gender}
                    onChange={(e) => {
                      setGender(e.target.value);
                      if (formErrors.gender) setFormErrors(p => ({ ...p, gender: undefined }));
                    }}
                    className={`w-full h-8.5 text-xs border rounded-lg px-2 bg-slate-50/50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 transition shadow-2xs cursor-pointer ${
                      formErrors.gender
                        ? "border-rose-400 focus:ring-rose-400/20 focus:border-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                    }`}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.gender && (
                    <p className="text-[9px] text-rose-600 font-medium mt-0.5">
                      {formErrors.gender}
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between h-4 mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      DOB <span className="text-rose-500">*</span>
                    </label>
                    {currentAge !== null && (
                      <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        {currentAge}y
                      </span>
                    )}
                  </div>
                  <DatePicker
                    size="sm"
                    value={dateOfBirth}
                    onChange={(val) => {
                      setDateOfBirth(val || "");
                      if (formErrors.dateOfBirth) setFormErrors(p => ({ ...p, dateOfBirth: undefined }));
                    }}
                    placeholder="DOB"
                    className={`h-8.5 text-xs rounded-lg px-2 bg-slate-50/50 hover:bg-white focus:bg-white border-slate-200 shadow-2xs ${
                      formErrors.dateOfBirth ? "border-rose-400" : ""
                    }`}
                  />
                  {formErrors.dateOfBirth && (
                    <p className="text-[9px] text-rose-600 font-medium mt-0.5">
                      {formErrors.dateOfBirth}
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between h-4 mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 truncate">
                      Flat / Villa
                    </label>
                  </div>
                  <input
                    type="text"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    placeholder="e.g. A-402"
                    className="w-full h-8.5 text-xs border border-slate-200 rounded-lg px-2 bg-slate-50/50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Optional Row 3: Relationship (when Family Member selected) */}
              {regType === "family" && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    placeholder="e.g. Son, Daughter, Spouse"
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50/50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Desktop Summary & Submit Card */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-violet-50/60 to-purple-50/40 border border-indigo-100/90 rounded-xl p-3 sm:p-3.5 shadow-xs hidden md:block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">Summary:</span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                {selectedCount} Selected
              </span>
            </div>

            {selectedCount > 0 ? (
              <div className="mb-3 space-y-1 max-h-44 overflow-y-auto pr-1">
                {selectedEvents.map(e => {
                  const meta = getSportMeta(e.sportName || e.name);
                  const selCat = categories.find(c => c.id === e.categoryId);
                  const el = checkCategoryEligibility(selCat, currentAge, gender);

                  return (
                    <div
                      key={e.eventId}
                      className={`flex flex-col gap-0.5 text-[10px] p-2 rounded-lg border ${
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
                        <span className="text-[9px] text-indigo-600 font-bold shrink-0">
                          {e.role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        <span className="truncate font-medium text-slate-600">
                          {selCat ? selCat.name : "No category"}
                        </span>
                        {!el.eligible ? (
                          <span className="text-rose-600 font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Ineligible
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Eligible
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 mb-3 flex items-center gap-1 bg-white/70 p-2 rounded-lg border border-slate-200/60">
                <Info className="w-3 h-3 text-amber-500 shrink-0" />
                Select sports from the right.
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selectedCount === 0}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/30"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting ({selectedCount})...</span>
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
        <div className="lg:col-span-8 space-y-3.5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">2</span>
                <h2 className="text-sm font-bold text-slate-900">Choose Sports Events</h2>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {selectedCount} of {eventSelections.length}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* List of sport event cards */}
            <div className="space-y-3">
              {eventSelections.map((ev) => {
                const sportKey = detectSport(ev.sportName || ev.name);
                const cfg = SPORT_CONFIGS[sportKey] || SPORT_CONFIGS.generic;
                const roles = cfg.categories.flatMap(c => c.roles);
                const meta = getSportMeta(ev.sportName || ev.name);
                const selectedCat = categories.find(c => c.id === ev.categoryId);
                const eligibility = checkCategoryEligibility(selectedCat, currentAge, gender);
                const hasError = Boolean(eventErrors[ev.eventId] || (ev.selected && !eligibility.eligible));

                return (
                  <div
                    key={ev.eventId}
                    className={`rounded-2xl border transition-all duration-200 p-3.5 sm:p-4 ${
                      ev.isRegistered
                        ? "bg-slate-50/80 border-slate-200 opacity-80"
                        : hasError
                          ? "bg-rose-50/30 border-rose-300 shadow-xs ring-1 ring-rose-400/20"
                          : ev.selected
                            ? "bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30 border-indigo-300 shadow-xs ring-1 ring-indigo-400/20"
                            : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection Checkbox */}
                      <button
                        type="button"
                        disabled={ev.isRegistered}
                        onClick={() => toggleEventSelection(ev.eventId)}
                        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${
                          ev.isRegistered
                            ? "bg-emerald-500 text-white cursor-not-allowed shadow-xs"
                            : ev.selected
                              ? hasError ? "bg-rose-600 text-white shadow-xs cursor-pointer" : "bg-indigo-600 text-white shadow-xs cursor-pointer"
                              : "border border-slate-300 bg-white hover:border-indigo-500 hover:bg-indigo-50/20 cursor-pointer"
                        }`}
                      >
                        {ev.isRegistered ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : ev.selected ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : null}
                      </button>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base sm:text-lg flex-shrink-0">{meta.emoji}</span>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {ev.name}
                            </h3>
                          </div>
                          
                          {ev.isRegistered ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold whitespace-nowrap flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              Already Registered
                            </span>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${meta.bg}`}>
                              {ev.sportName}
                            </span>
                          )}
                        </div>

                        {/* Location, category & schedule info */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1">
                          {ev.venueName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {ev.venueName}
                            </span>
                          )}
                          {ev.eventDateStart && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {format(new Date(ev.eventDateStart), "MMM d")}
                              {ev.eventDateEnd && ` – ${format(new Date(ev.eventDateEnd), "MMM d")}`}
                            </span>
                          )}
                        </div>

                        {/* Server or Inline Error Banner */}
                        {eventErrors[ev.eventId] && (
                          <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-rose-900">Registration Error</p>
                              <p className="text-[11px] text-rose-700">{eventErrors[ev.eventId]}</p>
                            </div>
                          </div>
                        )}

                        {/* Inline Role & Bracket Customization when selected */}
                        {ev.selected && !ev.isRegistered && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-2.5 bg-white/70 p-3 rounded-xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                  Playing Role
                                </label>
                                <select
                                  value={ev.role}
                                  onChange={(e) => updateEventField(ev.eventId, "role", e.target.value)}
                                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                                >
                                  {roles.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                  Category / Age Bracket <span className="text-rose-500">*</span>
                                </label>
                                <select
                                  value={ev.categoryId || ""}
                                  onChange={(e) => updateEventField(ev.eventId, "categoryId", Number(e.target.value))}
                                  className={`w-full text-xs font-semibold border rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 shadow-xs ${
                                    !eligibility.eligible
                                      ? "border-rose-400 focus:ring-rose-400/20 focus:border-rose-500 bg-rose-50/20"
                                      : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                                  }`}
                                >
                                  {categories.map(c => {
                                    const itemEl = checkCategoryEligibility(c, currentAge, gender);
                                    const ageLabel = `Age: ${c.minAge ?? 0}–${c.maxAge ?? 99}`;
                                    const genderLabel = c.gender || "All";
                                    return (
                                      <option key={c.id} value={c.id}>
                                        {c.name} ({genderLabel}, {ageLabel}) {!itemEl.eligible ? "— ⚠️ Ineligible" : "— ✓ Eligible"}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                            </div>

                            {/* Eligibility Status Feedback under the Category selector */}
                            {selectedCat && (
                              <div className="pt-1">
                                {eligibility.eligible ? (
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>
                                      Eligible for <span className="font-bold">{selectedCat.name}</span> (Participant age {currentAge !== null ? `${currentAge} yrs` : "N/A"} meets allowed {selectedCat.minAge ?? 0}–{selectedCat.maxAge ?? 99} yrs range)
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-1.5 text-[11px] font-semibold text-rose-800 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200">
                                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-bold text-rose-900">Ineligible for this category</p>
                                      <p className="text-[10px] text-rose-700 font-normal">{eligibility.reason}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Bottom Bar on Mobile for Instant Registration ── */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg z-30 md:hidden">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div>
            <div className="text-xs font-extrabold text-slate-900">
              {selectedCount} Sport{selectedCount !== 1 ? "s" : ""} Selected
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {playerName || "Participant"} {currentAge !== null ? `(${currentAge} yrs)` : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedCount === 0}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Register Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
