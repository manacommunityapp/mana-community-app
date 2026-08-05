import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Loader2, ArrowLeft, Info, Mail, ShieldCheck, CheckCircle2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { sportsService } from "../../../services/sports/sportsService";
import { otpService } from "../../../services/common/otpService";
import { useAuth } from "../../../contexts/AuthContext";
import {
  CREATE_EDIT_EVENT_REGISTRATIONS,
  CREATE_EDIT_SPORTS_MAIN,
} from "../../../constants/permissions";
import type { SportsEvent, PlayerCategory } from "../../../types/api";

function getEventFormats(event: SportsEvent | null): string[] {
  if (!event) return ["SINGLES"];
  let raw: any = event.format;
  if (!raw && (event as any).formats) raw = (event as any).formats;
  if (Array.isArray(raw)) return raw.length > 0 ? raw : ["SINGLES"];
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  }
  return ["SINGLES"];
}

// ─── Sport config ─────────────────────────────────────────────────────────────

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

function detectSport(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("cricket")) return "cricket";
  if (n.includes("football") || n.includes("soccer")) return "football";
  if (n.includes("volleyball")) return "volleyball";
  if (n.includes("basketball")) return "basketball";
  if (n.includes("badminton")) return "badminton";
  if (n.includes("kabaddi")) return "kabaddi";
  if (n.includes("hockey")) return "hockey";
  if (n.includes("throwball")) return "throwball";
  if (n.includes("rugby")) return "rugby";
  return "generic";
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

// ─── Component ────────────────────────────────────────────────────────────────

export function SportsRegister() {
  const { eventUuid } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const isAnyAdmin = hasAnyPermission(CREATE_EDIT_EVENT_REGISTRATIONS, CREATE_EDIT_SPORTS_MAIN);

  const [event, setEvent] = useState<SportsEvent | null>(null);
  const [categories, setCategories] = useState<PlayerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Email-OTP verification state.
  const [email, setEmail] = useState(user?.email ?? "");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [formData, setFormData] = useState({
    categoryIds: [] as number[],
    matchType: "SINGLES",
    role: "",
    age: user?.dateOfBirth ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear() : 25,
    matches: 0,
    runs: 0,
    wickets: 0,
    strikeRate: 0,
    avgScore: 0,
    regType: "self" as "self" | "family" | "other",
    playerName: user?.fullName || "",
    relation: "",
    flatNumber: "",
  });

  // Derived sport config
  const sportKey = detectSport(event?.sport?.name || "");
  const sportConfig = SPORT_CONFIGS[sportKey];

  const eventCategories = event?.categories && event.categories.length > 0 ? event.categories : categories;
  const availableFormats = getEventFormats(event);

  // Sync default matchType when event formats load
  useEffect(() => {
    if (event) {
      const formats = getEventFormats(event);
      if (formats.length > 0 && !formats.includes(formData.matchType)) {
        setFormData(prev => ({ ...prev, matchType: formats[0] }));
      }
    }
  }, [event]);

  // Get all matching roles for the selected Participant Type + Selected Categories
  const getRolesForSelectedTypeAndCategories = () => {
    const currentFormat = formData.matchType.toUpperCase();
    const rolesSet = new Set<string>();

    const formatCfgCat = sportConfig.categories.find(
      c => c.value.toUpperCase() === currentFormat || currentFormat.includes(c.value.toUpperCase()) || c.value.toUpperCase().includes(currentFormat)
    );

    if (formatCfgCat && formatCfgCat.roles.length > 0) {
      formatCfgCat.roles.forEach(r => rolesSet.add(r));
    }

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
    if (user?.dateOfBirth) {
      const birthYear = new Date(user.dateOfBirth).getFullYear();
      setFormData(prev => ({ ...prev, age: new Date().getFullYear() - birthYear }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

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
    if (formData.categoryIds.length === 0) {
      toast.error("Please select at least one category");
      return;
    }
    if (!event?.id) {
      toast.error("Event details are still loading");
      return;
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

    setSubmitting(true);
    try {
      for (const catId of formData.categoryIds) {
        await sportsService.registerForEvent({
          eventId: event.id,
          categoryId: catId,
          matchType: formData.matchType,
          role: formData.role,
          age: formData.age,
          matches: formData.matches,
          runs: formData.runs,
          wickets: formData.wickets,
          strikeRate: formData.strikeRate,
          avgScore: formData.avgScore,
          playerName: formData.playerName,
          email: email.trim() || undefined,
          relation: formData.relation,
          flatNumber: formData.flatNumber,
          recaptchaToken,
        });
      }

      toast.success(event.adminApprovalRequired === false
        ? "Registration confirmed! Good luck."
        : "Registration submitted! You'll be notified once it's approved.");
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
    formData.matchType.length > 0,
    formData.categoryIds.length > 0,
    formData.playerName.trim().length > 0,
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
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            Event Registration
          </span>
        </div>
      </div>

      {/* ── 2-Column Responsive Layout ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT COLUMN: Registration Form Controls (7 cols) ──── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Step Indicator */}
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2">
              {["Format", "Category", "Details", "Role"].map((label, i) => (
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
                  playerName: tab.key === "self" ? (user?.fullName || "") : "",
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
            {/* 1. Participant Type (Format) */}
            {availableFormats.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Participant Type</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-5 ml-[38px]">
                    Choose your participation format
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {availableFormats.map((fmt) => {
                      const isSelected = formData.matchType.toUpperCase() === fmt.toUpperCase();
                      const formatLabel = fmt.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, matchType: fmt }))}
                          className={`group relative px-5 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-300 flex items-center gap-2.5 ${
                            isSelected
                              ? "bg-gradient-to-r from-primary to-indigo-500 border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                              : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:shadow-sm"
                          }`}
                        >
                          <span>{formatLabel}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-white/80" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Select Categories */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <span className="text-sm">🏷️</span>
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Select Categories</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-5 ml-[38px]">
                Pick one or more categories for your registration
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {eventCategories.map((cat) => {
                  const isChecked = formData.categoryIds.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className={`relative flex items-start gap-3.5 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer select-none group ${
                        isChecked
                          ? "bg-primary/5 border-primary shadow-sm shadow-primary/10"
                          : "bg-card border-border hover:border-primary/30 hover:shadow-sm"
                      }`}
                    >
                      <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
                        isChecked
                          ? "bg-primary border-primary"
                          : "border-border group-hover:border-primary/40"
                      }`}>
                        {isChecked && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setFormData((prev) => {
                            const newIds = prev.categoryIds.includes(cat.id)
                              ? prev.categoryIds.filter((id) => id !== cat.id)
                              : [...prev.categoryIds, cat.id];
                            return { ...prev, categoryIds: newIds };
                          });
                        }}
                        className="sr-only"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold transition-colors ${isChecked ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                          {cat.name}
                        </p>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cat.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                            Age: {cat.minAge}–{cat.maxAge}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                            {cat.gender}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. Player Identity */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Player Identity</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Player Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      Player Name
                    </label>
                    <input
                      name="playerName"
                      type="text"
                      value={formData.playerName}
                      onChange={handleInputChange}
                      readOnly={formData.regType === "self"}
                      placeholder={formData.regType === "self" ? "" : "Enter full name"}
                      className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                        formData.regType === "self"
                          ? "text-muted-foreground cursor-not-allowed opacity-70"
                          : "text-foreground"
                      }`}
                    />
                  </div>

                  {/* Primary Role */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Primary Role {formData.matchType ? `(${formData.matchType.replace(/_/g, " ")})` : ""}
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                    >
                      <option value="">Select Role</option>
                      {availableRoles.map((r: string) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Relationship (family) */}
                  {formData.regType === "family" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Relationship</label>
                      <select
                        name="relation"
                        value={formData.relation}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      >
                        <option value="">Select Relation</option>
                        <option value="SPOUSE">Spouse</option>
                        <option value="CHILD">Child</option>
                        <option value="PARENT">Parent</option>
                        <option value="SIBLING">Sibling</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  )}

                  {/* Flat Number (admin) */}
                  {formData.regType === "other" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Flat Number</label>
                      <input
                        name="flatNumber"
                        type="text"
                        value={formData.flatNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. A-101"
                        required
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      />
                    </div>
                  )}

                  {/* Age */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Age</label>
                    <input
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Career Statistics */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
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
                disabled={submitting || (OTP_REQUIRED && !emailVerified)}
                className="flex-[2] py-3 bg-gradient-to-r from-primary via-indigo-500 to-violet-500 hover:from-primary/90 hover:via-indigo-500/90 hover:to-violet-500/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                ) : (
                  <>Submit Registration <span className="text-lg">→</span></>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── RIGHT COLUMN: Sticky Event Summary Card (5 cols) ──── */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
