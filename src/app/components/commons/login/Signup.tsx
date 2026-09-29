import { useState, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Building2,
  Home,
  GraduationCap,
  Loader2,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Sparkles,
  Layers,
  Check,
  Users,
  CalendarCheck,
  Bell,
  QrCode,
  MessageSquare,
  Heart,
  Star,
  Zap,
  ChevronDown,
  RefreshCw,
  Search,
  X,
  KeyRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../../../contexts/AuthContext";
import { communityService } from "../../../../services/community/communityService";
import { authService } from "../../../../services/common/authService";
import { otpService } from "../../../../services/common/otpService";
import type { CommunityResponse, BlockConfigResponse } from "../../../../types/api";
import { PasswordStrengthMeter } from "../PasswordStrengthMeter";
import { evaluatePassword, generateStrongPassword } from "../../../../utils/passwordStrength";
import { PrivacyPolicyModal } from "../privacy/PrivacyPolicyModal";

type Step = 1 | 2 | 3;

type SignupFormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  communityType: string;
  communityCode: string;
  userType: string;
  gender: string;
  block: string;
  flatNo: string;
  terms: boolean;
};

// ── Default Block Configuration for APARTMENT communities ───────────────
// A/B/D: 10 floors, 11 flats per floor = 110 flats each
// C: 10 floors, 12 flats per floor = 120 flats
// Total = 450 flats
const DEFAULT_BLOCK_CONFIGS: BlockConfigResponse[] = [
  {
    blockName: "A",
    totalFloors: 10,
    flatsPerFloor: 11,
    totalFlats: 110,
    floors: Array.from({ length: 10 }, (_, i) => {
      const fl = i + 1;
      const base = fl * 100;
      return {
        floor: fl,
        flats: Array.from({ length: 11 }, (_, j) => String(base + j + 1)),
      };
    }),
  },
  {
    blockName: "B",
    totalFloors: 10,
    flatsPerFloor: 11,
    totalFlats: 110,
    floors: Array.from({ length: 10 }, (_, i) => {
      const fl = i + 1;
      const base = fl * 100;
      return {
        floor: fl,
        flats: Array.from({ length: 11 }, (_, j) => String(base + j + 1)),
      };
    }),
  },
  {
    blockName: "C",
    totalFloors: 10,
    flatsPerFloor: 12,
    totalFlats: 120,
    floors: Array.from({ length: 10 }, (_, i) => {
      const fl = i + 1;
      const base = fl * 100;
      return {
        floor: fl,
        flats: Array.from({ length: 12 }, (_, j) => String(base + j + 1)),
      };
    }),
  },
  {
    blockName: "D",
    totalFloors: 10,
    flatsPerFloor: 11,
    totalFlats: 110,
    floors: Array.from({ length: 10 }, (_, i) => {
      const fl = i + 1;
      const base = fl * 100;
      return {
        floor: fl,
        flats: Array.from({ length: 11 }, (_, j) => String(base + j + 1)),
      };
    }),
  },
];

// ── Left Brand Panel Feature Highlights ──────────────────────
const FEATURES = [
  { icon: CalendarCheck, text: "Event & Pooja bookings with instant QR passes" },
  { icon: Bell, text: "Real-time community announcements & emergency alerts" },
  { icon: QrCode, text: "Digital family pass wallet — always at hand" },
  { icon: MessageSquare, text: "Connect with neighbors, committees & facility teams" },
  { icon: Heart, text: "Volunteer, donate & celebrate together" },
];

function BrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between relative overflow-hidden h-screen sticky top-0 text-white p-6 xl:p-8 select-none border-r border-white/10"
      style={{
        background: "linear-gradient(160deg, #4f46e5 0%, #4338ca 35%, #3730a3 70%, #1e1b4b 100%)",
      }}
    >
      {/* Decorative ambient glowing orbs */}
      <div
        className="absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-30 pointer-events-none blur-3xl"
        style={{ background: "radial-gradient(circle, #818cf8, transparent)" }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full opacity-25 pointer-events-none blur-3xl"
        style={{ background: "radial-gradient(circle, #c084fc, transparent)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Header & Brand Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-5 xl:mb-6">
          <div className="w-9 h-9 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/25 shadow-md shadow-black/10">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-extrabold text-base tracking-tight leading-none">Mana Community</p>
            <p className="text-indigo-200 text-[11px] font-medium mt-0.5">Your neighborhood, connected</p>
          </div>
        </div>

        {/* Hero copy */}
        <div className="mb-5 xl:mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-2.5 shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span className="text-[11px] font-bold text-amber-100 tracking-wide">
              Resident Registration Portal
            </span>
          </div>
          <h2 className="text-white leading-[1.15] mb-2 text-xl xl:text-2xl font-black tracking-tight">
            Your community,
            <br />
            <span className="text-amber-300">at your fingertips.</span>
          </h2>
          <p className="text-indigo-100/80 text-xs leading-relaxed max-w-xs">
            Join thousands of residents enjoying seamless event bookings, live announcements, and digital passes.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-1.5">
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-2 group">
              <div className="w-4.5 h-4.5 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/15 mt-0.5 shadow-xs">
                <Icon className="w-3 h-3 text-amber-200" />
              </div>
              <p className="text-indigo-50/90 text-[11px] leading-snug font-medium pt-0.5">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resident Testimonial & Security Badge */}
      <div className="relative z-10 space-y-2.5 pt-3 border-t border-white/10">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/15 p-3 shadow-md shadow-black/5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex -space-x-1.5">
              {["#4f46e5", "#818cf8", "#10b981", "#ec4899"].map((c, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-white/60 flex items-center justify-center text-[8px] font-bold text-white shadow-xs"
                  style={{ background: c }}
                >
                  {["R", "K", "S", "P"][i]}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
              ))}
            </div>
          </div>
          <p className="text-indigo-50/90 text-[10.5px] leading-relaxed italic">
            "Booking Ganesh Pooja seva for my family was so easy — scanned the QR at the gate and walked straight in!"
          </p>
          <p className="text-amber-200 text-[9.5px] font-semibold mt-0.5"> Lakshmi's Emperia</p>
        </div>

        <div className="flex items-center justify-between text-indigo-200/70 text-[10px] px-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Verified resident portal
          </span>
          <span>v2.4.0</span>
        </div>
      </div>
    </div>
  );
}

// ── Step Progress Indicator ──────────────────────────────────
const STEPS = [
  { label: "Account & Security", short: "1" },
  { label: "Community & Unit", short: "2" },
];

function StepBar({
  currentStep,
  onStepClick,
}: {
  currentStep: Step;
  onStepClick: (step: Step) => void;
}) {
  return (
    <div className="flex items-center gap-0 mb-2.5 sm:mb-3.5">
      {STEPS.map((s, i) => {
        const num = (i + 1) as Step;
        const isDone = num < currentStep;
        const isActive = num === currentStep;
        const isClickable = num < currentStep;

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(num)}
              className={`flex flex-col items-center gap-0.5 select-none transition-all outline-none ${
                isClickable ? "cursor-pointer group" : "cursor-default"
              }`}
            >
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10.5px] font-bold transition-all duration-300 shrink-0 ${
                  isDone
                    ? "bg-primary text-white shadow-xs group-hover:scale-105"
                    : isActive
                    ? "bg-primary text-white ring-2 ring-primary/25 shadow-xs scale-105"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {isDone ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" /> : num}
              </div>
              <span
                className={`text-[8.5px] sm:text-[9.5px] font-medium hidden sm:block transition-colors ${
                  isActive
                    ? "text-primary font-bold"
                    : isDone
                    ? "text-foreground group-hover:text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </button>

            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-[1.5px] mx-1 sm:mx-1.5 rounded-full transition-all duration-500 ${
                  isDone ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Section Header ───────────────────────────────────────────
function SectionHead({ num, title, sub }: { num: number; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 mb-2 border-b border-border/80">
      <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white shrink-0 bg-gradient-to-tr from-primary to-indigo-500 shadow-xs">
        {num}
      </div>
      <div>
        <p className="text-[11px] sm:text-xs font-bold text-foreground leading-none">{title}</p>
        <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ── Searchable Select Combobox Dropdown ─────────────────────────
interface SearchableDropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface SearchableDropdownProps {
  id?: string;
  label: string;
  placeholder: string;
  searchPlaceholder?: string;
  value: string;
  options: SearchableDropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  disabledHint?: string;
  icon: React.ComponentType<{ className?: string }>;
  error?: string;
  required?: boolean;
}

function SearchableDropdown({
  id,
  label,
  placeholder,
  searchPlaceholder = "Search...",
  value,
  options,
  onChange,
  disabled = false,
  disabledHint,
  icon: Icon,
  error,
  required = false,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [search, options]);

  const selectedOpt = options.find((o) => o.value === value);

  return (
    <div className="relative w-full min-w-0 max-w-full" ref={containerRef}>
      <div className="flex items-center justify-between mb-0.5 gap-1">
        <label htmlFor={id} className="block text-[10.5px] sm:text-[11px] font-semibold text-foreground/85 tracking-tight truncate">
          {label} {required && <span className="text-primary">*</span>}
        </label>
        {selectedOpt && (
          <span className="text-[9.5px] sm:text-[10px] text-primary font-bold px-1.5 py-0.2 rounded-md bg-primary/10 border border-primary/20 shrink-0 truncate max-w-[140px]">
            {selectedOpt.badge || selectedOpt.label}
          </span>
        )}
      </div>

      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-w-0 max-w-full h-9 sm:h-10 px-3 bg-slate-50/75 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900/90 focus:bg-white dark:focus:bg-slate-950 border ${
          error
            ? "border-destructive ring-2 ring-destructive/20"
            : isOpen
            ? "border-primary ring-3 ring-primary/15 bg-white dark:bg-slate-950 shadow-xs"
            : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
        } rounded-lg sm:rounded-xl text-foreground flex items-center justify-between transition-all duration-200 text-xs text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs group overflow-hidden box-border`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Icon className="w-3 h-3" />
          </div>
          <span className={`truncate min-w-0 block flex-1 text-xs ${selectedOpt ? "font-bold text-foreground" : "text-muted-foreground/60"}`}>
            {selectedOpt ? selectedOpt.label : disabled && disabledHint ? disabledHint : placeholder}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ml-1 ${isOpen ? "rotate-180 text-primary" : ""}`} />
      </button>

      {error && <p className="text-destructive text-[10px] sm:text-[11px] mt-0.5 font-medium">{error}</p>}
      {!disabled && !error && disabledHint && !value && (
        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium truncate">{disabledHint}</p>
      )}

      {/* Popover Dropdown with Search */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 w-full min-w-0 max-w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-56 box-border">
          {/* Search filter input inside dropdown */}
          <div className="p-2 border-b border-border bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-10 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-0.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full min-w-0 bg-transparent text-[11px] py-0.5 px-1 text-foreground placeholder:text-muted-foreground/60 outline-none font-medium truncate"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto p-1 space-y-0.5 max-h-44 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="py-3 text-center text-[11px] text-muted-foreground">
                No matches found for "{search}"
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full min-w-0 max-w-full px-2 py-1.5 rounded-lg text-[11px] flex items-center justify-between text-left transition-colors cursor-pointer overflow-hidden ${
                      isSelected
                        ? "bg-primary text-white font-bold shadow-xs"
                        : "hover:bg-accent text-foreground"
                    }`}
                  >
                    <div className="min-w-0 flex-1 overflow-hidden pr-1.5">
                      <p className="truncate font-medium min-w-0">{opt.label}</p>
                      {opt.sublabel && (
                        <p className={`text-[9.5px] truncate min-w-0 ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                          {opt.sublabel}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check className="w-3 h-3 shrink-0 text-white" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Registration / Signup Component ─────────────────────
export function Signup() {
  const [step, setStep] = useState<Step>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [isLoadingCommunities, setIsLoadingCommunities] = useState<boolean>(true);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState<boolean>(false);
  const [selectedFloor, setSelectedFloor] = useState<number | "">("");
  const [blockConfigs, setBlockConfigs] = useState<BlockConfigResponse[]>(DEFAULT_BLOCK_CONFIGS);
  const [flatSearchQuery, setFlatSearchQuery] = useState<string>("");
  const [showFlatSearchMenu, setShowFlatSearchMenu] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("");
  const [isSendingSignupOtp, setIsSendingSignupOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const flatSearchContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const signupOtpInputRef = useRef<HTMLInputElement>(null);

  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      gender: "MALE",
      password: "",
      confirmPassword: "",
      terms: false,
      userType: "Owner",
      communityType: "apartment",
      communityCode: "",
      block: "",
      flatNo: "",
    },
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const email = watch("email");
  const fullName = watch("fullName");
  const phone = watch("phone");
  const block = watch("block");
  const flatNo = watch("flatNo");
  const userType = watch("userType");
  const communityType = watch("communityType");
  const communityCode = watch("communityCode");

  // Computed block layout and flat numbers loaded from database
  const activeBlockConfig = blockConfigs.find(
    (bc) => bc.blockName.toUpperCase() === (block || "").toUpperCase()
  );

  const availableFloors = activeBlockConfig
    ? activeBlockConfig.floors?.map((f) => f.floor) || Array.from({ length: activeBlockConfig.totalFloors || 10 }, (_, i) => i + 1)
    : [];

  const availableFlats: string[] = (() => {
    if (!activeBlockConfig) return [];
    const all: string[] = [];
    const totalFloors = activeBlockConfig.totalFloors || 10;
    for (let fl = 1; fl <= totalFloors; fl++) {
      const floorObj = activeBlockConfig.floors?.find((f) => f.floor === fl);
      if (floorObj?.flats?.length) {
        all.push(...floorObj.flats);
      } else {
        const count = activeBlockConfig.flatsPerFloor || (activeBlockConfig.blockName.toUpperCase() === "C" ? 12 : 11);
        const base = fl * 100;
        all.push(...Array.from({ length: count }, (_, i) => String(base + i + 1)));
      }
    }
    return all;
  })();

  // All community flats flat list for quick searching across all blocks & floors
  const allCommunityFlats = useMemo(() => {
    const list: { block: string; floor: number; flatNo: string; label: string }[] = [];
    for (const bc of blockConfigs) {
      const totalFloors = bc.totalFloors || 10;
      for (let fl = 1; fl <= totalFloors; fl++) {
        const floorObj = bc.floors?.find((f) => f.floor === fl);
        let flats = floorObj?.flats;
        if (!flats || flats.length === 0) {
          const flatsCount = bc.flatsPerFloor || (bc.blockName.toUpperCase() === "C" ? 12 : 11);
          const base = fl * 100;
          flats = Array.from({ length: flatsCount }, (_, i) => String(base + i + 1));
        }
        for (const fNo of flats) {
          list.push({
            block: bc.blockName,
            floor: fl,
            flatNo: fNo,
            label: `Block ${bc.blockName} · Floor ${fl} · Flat ${fNo}`,
          });
        }
      }
    }
    return list;
  }, [blockConfigs]);

  const matchingFlats = useMemo(() => {
    const q = flatSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return allCommunityFlats
      .filter((item) => {
        return (
          item.flatNo.toLowerCase().includes(q) ||
          `block ${item.block}`.toLowerCase().includes(q) ||
          `${item.block}-${item.flatNo}`.toLowerCase().includes(q) ||
          item.label.toLowerCase().includes(q)
        );
      })
      .slice(0, 12);
  }, [flatSearchQuery, allCommunityFlats]);

  const selectQuickFlat = (item: { block: string; floor: number; flatNo: string }) => {
    setValue("block", item.block, { shouldValidate: true });
    setSelectedFloor(item.floor);
    setValue("flatNo", item.flatNo, { shouldValidate: true });
    clearErrors(["block", "flatNo"]);
    setFlatSearchQuery("");
    setShowFlatSearchMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (flatSearchContainerRef.current && !flatSearchContainerRef.current.contains(e.target as Node)) {
        setShowFlatSearchMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendSignupOtpEmail = async () => {
    const isEmailValid = await trigger("email");
    if (!isEmailValid || !email?.trim()) {
      setError("email", { type: "manual", message: "Please enter a valid email address first" });
      return;
    }

    if (phone?.trim()) {
      const isPhoneValid = await trigger("phone");
      if (!isPhoneValid) return;
    }

    setIsSendingSignupOtp(true);
    try {
      await authService.sendSignupOtp(email.trim(), phone?.trim() || "");
      setResendCooldown(60);
      toast.success(`Verification code sent to ${email}`);
      setTimeout(() => signupOtpInputRef.current?.focus(), 150);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send verification code";
      toast.error(message);
      if (message.toLowerCase().includes("email")) {
        setError("email", { type: "manual", message });
      }
      if (message.toLowerCase().includes("phone") || message.toLowerCase().includes("mobile")) {
        setError("phone", { type: "manual", message });
      }
    } finally {
      setIsSendingSignupOtp(false);
    }
  };

  const handleSuggestPassword = () => {
    const suggested = generateStrongPassword(10);
    setValue("password", suggested, { shouldValidate: true });
    setValue("confirmPassword", suggested, { shouldValidate: true });
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  const loadCommunities = async () => {
    setIsLoadingCommunities(true);
    setCommunitiesError(null);
    try {
      const data = await communityService.getCommunities(communityType);
      const list = data && data.length > 0 ? data : [
        {
          id: 1,
          name: "Lakshmi's Emperia",
          code: "EMP-2024",
          inviteCode: "EMP-2024",
          type: "apartment",
          city: "Hyderabad",
          state: "Telangana",
          blockConfigs: DEFAULT_BLOCK_CONFIGS,
        } as CommunityResponse
      ];
      setCommunities(list);

      // Auto select the single/first community
      if (list.length > 0) {
        const defaultComm = list[0];
        const commIdStr = String(defaultComm.id);
        setSelectedCommunityId(commIdStr);
        const code = defaultComm.inviteCode || defaultComm.code || "";
        setValue("communityCode", code, { shouldValidate: true });
        if (defaultComm.blockConfigs && defaultComm.blockConfigs.length > 0) {
          setBlockConfigs(defaultComm.blockConfigs);
        } else {
          setBlockConfigs(DEFAULT_BLOCK_CONFIGS);
        }
      }
    } catch (err: any) {
      const fallbackList: CommunityResponse[] = [
        {
          id: 1,
          name: "Lakshmi's Emperia",
          code: "EMP-2024",
          inviteCode: "EMP-2024",
          type: "apartment",
          city: "Hyderabad",
          state: "Telangana",
          blockConfigs: DEFAULT_BLOCK_CONFIGS,
        }
      ];
      setCommunities(fallbackList);
      setSelectedCommunityId("1");
      setValue("communityCode", "EMP-2024", { shouldValidate: true });
      setBlockConfigs(DEFAULT_BLOCK_CONFIGS);
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, [communityType]);

  const handleCommunityChange = async (communityIdStr: string) => {
    setSelectedCommunityId(communityIdStr);
    setSelectedFloor("");
    setValue("block", "", { shouldValidate: false });
    setValue("flatNo", "", { shouldValidate: false });
    if (!communityIdStr) {
      setValue("communityCode", "", { shouldValidate: true });
      setBlockConfigs(DEFAULT_BLOCK_CONFIGS);
      return;
    }
    const found = communities.find((c) => String(c.id) === communityIdStr);
    if (found) {
      const code = found.inviteCode || found.code || "";
      setValue("communityCode", code, { shouldValidate: true });
      if (found.blockConfigs && found.blockConfigs.length > 0) {
        setBlockConfigs(found.blockConfigs);
      } else {
        setIsLoadingBlocks(true);
        try {
          const cfgs = await communityService.getBlockConfigs(found.id);
          if (Array.isArray(cfgs) && cfgs.length > 0) {
            setBlockConfigs(cfgs);
          } else {
            setBlockConfigs(DEFAULT_BLOCK_CONFIGS);
          }
        } catch {
          setBlockConfigs(DEFAULT_BLOCK_CONFIGS);
        } finally {
          setIsLoadingBlocks(false);
        }
      }
    }
  };

  const validateCurrentStep = async (s: Step): Promise<boolean> => {
    // Step 1: Personal Details, OTP Verification, and Password
    if (s === 1) {
      const valid = await trigger(["fullName", "email", "phone", "password", "confirmPassword"]);
      if (!valid || phone?.length !== 10) return false;

      const code = otpCode.trim();
      if (!code || code.length < 6) {
        if (!code) {
          await sendSignupOtpEmail();
          toast.error("Please enter the 6-digit verification code sent to your email address");
        } else {
          toast.error("Please enter the complete 6-digit verification code");
        }
        signupOtpInputRef.current?.focus();
        return false;
      }
      try {
        const result = await authService.verifySignupOtp(email.trim(), phone.trim(), code);
        if (!result.verified && !result.success) {
          toast.error(result.message || "Incorrect or expired verification code. Please try again.");
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to verify code. Please try again.";
        toast.error(message);
        if (message.toLowerCase().includes("email")) {
          setError("email", { type: "manual", message });
        }
        if (message.toLowerCase().includes("phone") || message.toLowerCase().includes("mobile")) {
          setError("phone", { type: "manual", message });
        }
        return false;
      }
      return true;
    }

    // Step 2: Community, Residence, and Terms
    if (s === 2) {
      const commValid = await trigger(["communityType", "communityCode", "terms"]);
      if (!communityCode?.trim()) {
        setError("communityCode", { type: "manual", message: "Please select a community to obtain invite code" });
        return false;
      }
      if (!commValid) return false;

      if (communityType === "apartment") {
        if (!block) {
          setError("block", { type: "manual", message: "Please select a block / wing" });
          return false;
        }
        if (!flatNo) {
          setError("flatNo", { type: "manual", message: "Please select a flat number" });
          return false;
        }
        const valid = await trigger(["block", "flatNo"]);
        return valid;
      }
      return true;
    }

    return true;
  };

  const advance = async () => {
    const isValid = await validateCurrentStep(step);
    if (!isValid) return;

    if (step < 2) {
      setStep((s) => (s + 1) as Step);
      formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const back = () => {
    setStep((s) => Math.max(s - 1, 1) as Step);
    formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (data: SignupFormValues) => {
    try {
      // Validate Block / Wing & Flat Number in community table service before registering
      if (data.communityType === "apartment" && data.block && data.flatNo) {
        const communityIdentifier = selectedCommunityId
          ? Number(selectedCommunityId)
          : data.communityCode;
        const alreadyExists = await communityService.checkUnitExists(
          communityIdentifier,
          data.block,
          data.flatNo
        );

        if (alreadyExists) {
          setError("flatNo", {
            type: "manual",
            message: `Block ${data.block.toUpperCase()} - Flat ${data.flatNo} is already registered in this community`,
          });
          setError("block", {
            type: "manual",
            message: `Unit ${data.block.toUpperCase()}-${data.flatNo} already occupied`,
          });
          toast.error(
            `Block ${data.block.toUpperCase()} - Flat ${data.flatNo} is already registered in this community. Please check your unit number.`
          );
          setStep(2);
          return;
        }
      }

      await registerUser({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        inviteCode: data.communityCode,
        password: data.password,
        gender: data.gender,
        block: data.block,
        flatNo: data.flatNo,
        userType: data.userType || "Owner",
        occupancyStatus: data.userType || "Owner",
        emailOtpCode: otpCode.trim(),
      });

      toast.success("Account created! Welcome to the community.");
      setStep(3);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
      if (message.toLowerCase().includes("email")) {
        setError("email", { type: "manual", message });
        setStep(1);
      } else if (message.toLowerCase().includes("phone") || message.toLowerCase().includes("mobile")) {
        setError("phone", { type: "manual", message });
        setStep(1);
      } else if (message.toLowerCase().includes("block") || message.toLowerCase().includes("flat") || message.toLowerCase().includes("unit")) {
        setError("flatNo", { type: "manual", message });
        setStep(2);
      }
    }
  };

  const communityTypes = [
    {
      value: "apartment",
      label: "Apartment",
      desc: "Gated communities & societies",
      icon: Building2,
    },
    {
      value: "college",
      label: "College / Campus",
      desc: "Universities & student hostels",
      icon: GraduationCap,
    },
    {
      value: "local",
      label: "Local Community",
      desc: "Neighborhoods & associations",
      icon: Home,
    },
  ];

  const STEP_HEADINGS = [
    { title: "Create your account", sub: "Personal Details & Password · Step 1 of 2" },
    { title: "Select your residence", sub: "Community & Flat Unit · Step 2 of 2" },
  ];

  const inputBase =
    "w-full h-9 sm:h-10 bg-slate-50/75 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900/90 focus:bg-white dark:focus:bg-slate-950 border border-slate-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 rounded-lg sm:rounded-xl text-foreground placeholder:text-muted-foreground/45 focus:ring-3 focus:ring-primary/15 focus:border-primary outline-none transition-all duration-200 text-xs font-medium shadow-2xs";
  const labelCls = "block text-[10.5px] sm:text-[11px] font-bold text-foreground/85 mb-1 tracking-tight";

  return (
    <div className="h-screen w-screen flex bg-background text-foreground selection:bg-primary/20 overflow-hidden">
      {/* Left Brand Showcase Panel (Desktop Browser) */}
      <div className="lg:w-[380px] xl:w-[420px] 2xl:w-[460px] shrink-0">
        <BrandPanel />
      </div>

      {/* Right Multi-Step Form Panel (Browser Viewport) */}
      <div
        className="flex-1 flex flex-col justify-between bg-background h-full overflow-y-auto relative"
        ref={formRef}
      >
        {/* Subtle radial ambient glow */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-primary/5 rounded-full blur-[130px] pointer-events-none -z-0" />

        {/* Mobile top header branding */}
        <div className="lg:hidden px-3.5 py-1.5 flex items-center gap-2 border-b border-border bg-card/60 backdrop-blur-sm shrink-0">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-primary text-white shadow-xs shadow-primary/25">
            <ShieldCheck className="w-3 h-3" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-foreground leading-tight">Mana Community</p>
            <p className="text-[9px] text-muted-foreground">Resident Registration</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="px-3.5 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-3 max-w-[660px] xl:max-w-[720px] 2xl:max-w-[780px] w-full mx-auto relative z-10 flex-1 flex flex-col justify-center my-auto">
          {step < 3 ? (
            <>
              {/* Header Title & Subtitle */}
              <div className="mb-2">
                <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight mb-0.5">
                  {STEP_HEADINGS[step - 1].title}
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                  {STEP_HEADINGS[step - 1].sub}
                </p>
              </div>

              {/* Progress Step Bar */}
              <StepBar currentStep={step} onStepClick={(s) => setStep(s)} />

              {/* Form Body */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && step < 2 && (e.target as HTMLElement).tagName !== "BUTTON") {
                    e.preventDefault();
                    advance();
                  }
                }}
                className="space-y-2.5 sm:space-y-3"
              >
                {/* ── STEP 1: Personal Details, Verification & Password ──── */}
                {step === 1 && (
                  <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-200">
                    <div className="bg-card/90 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border/80 space-y-2.5 sm:space-y-3 shadow-lg shadow-black/5">
                      {/* Full Name & Phone Number */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        <div>
                          <label htmlFor="fullName" className={labelCls}>
                            Full Name <span className="text-primary">*</span>
                          </label>
                          <div className="relative">
                            <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                              <User className="w-3 h-3" />
                            </div>
                            <input
                              id="fullName"
                              type="text"
                              autoComplete="off"
                              {...register("fullName", { required: "Full name is required" })}
                              className={`${inputBase} pl-9 pr-3`}
                              placeholder="e.g. Rahul Sharma"
                            />
                          </div>
                          {errors.fullName && (
                            <p className="text-destructive text-[10px] sm:text-[11px] mt-0.5 font-medium">
                              {errors.fullName.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label htmlFor="phone" className={labelCls}>
                              Phone Number <span className="text-primary">*</span>
                            </label>
                            <span className="text-[9.5px] text-muted-foreground font-semibold">
                              10 digits
                            </span>
                          </div>
                          <div className="relative flex items-center">
                            <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                              <Phone className="w-3 h-3" />
                            </div>
                            <input
                              id="phone"
                              type="tel"
                              inputMode="numeric"
                              maxLength={10}
                              autoComplete="off"
                              {...register("phone", {
                                required: "Phone number is required",
                                pattern: {
                                  value: /^[6-9]\d{9}$/,
                                  message: "Enter a valid 10-digit Indian mobile number",
                                },
                                minLength: {
                                  value: 10,
                                  message: "Phone number must be exactly 10 digits",
                                },
                                maxLength: {
                                  value: 10,
                                  message: "Phone number must be exactly 10 digits",
                                },
                              })}
                              onKeyDown={(e) => {
                                if (
                                  e.key.length === 1 &&
                                  !/^\d$/.test(e.key) &&
                                  !e.ctrlKey &&
                                  !e.metaKey
                                ) {
                                  e.preventDefault();
                                }
                              }}
                              onPaste={(e) => {
                                e.preventDefault();
                                const text = e.clipboardData
                                  .getData("text")
                                  .replace(/\D/g, "")
                                  .slice(0, 10);
                                setValue("phone", text, { shouldValidate: true });
                              }}
                              onChange={(e) => {
                                const numeric = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setValue("phone", numeric, { shouldValidate: true });
                              }}
                              className={`${inputBase} pl-9 pr-3 tracking-wider font-semibold`}
                              placeholder="9876543210"
                            />
                          </div>
                          {errors.phone && (
                            <p className="text-destructive text-[10px] sm:text-[11px] mt-0.5 font-medium">{errors.phone.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Email & OTP Verification */}
                      <div className="space-y-2 p-2.5 bg-primary/5 border border-primary/15 rounded-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                          <div>
                            <label htmlFor="signup-email" className={labelCls}>
                              Email Address <span className="text-primary">*</span>
                            </label>
                            <div className="relative">
                              <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Mail className="w-3 h-3" />
                              </div>
                              <input
                                id="signup-email"
                                type="email"
                                autoComplete="off"
                                {...register("email", {
                                  required: "Email address is required",
                                  pattern: {
                                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                    message:
                                      "Please enter a valid email address (e.g. name@example.com)",
                                  },
                                })}
                                className={`${inputBase} pl-9 pr-3`}
                                placeholder="name@example.com"
                              />
                            </div>
                            {errors.email && (
                              <p className="text-destructive text-[10px] sm:text-[11px] mt-0.5 font-medium">{errors.email.message}</p>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label htmlFor="otpCodeInput" className={labelCls}>
                                Verification Code <span className="text-primary">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={sendSignupOtpEmail}
                                disabled={resendCooldown > 0 || isSendingSignupOtp}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-transparent border-none py-0.2 px-1 rounded-md hover:bg-primary/10 transition-colors"
                              >
                                <RefreshCw className={`w-2.5 h-2.5 ${isSendingSignupOtp ? "animate-spin" : ""}`} />
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Send Code"}
                              </button>
                            </div>
                            <div className="relative">
                              <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                <KeyRound className="w-3 h-3" />
                              </div>
                              <input
                                id="otpCodeInput"
                                ref={signupOtpInputRef}
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                autoComplete="one-time-code"
                                value={otpCode}
                                onChange={(e) => {
                                  const numeric = e.target.value.replace(/\D/g, "").slice(0, 6);
                                  setOtpCode(numeric);
                                }}
                                placeholder="6-digit code"
                                className={`${inputBase} pl-9 pr-3 text-center sm:text-left text-xs sm:text-sm font-bold font-mono tracking-[0.2em]`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Password & Confirm Password */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label htmlFor="signup-password" className={labelCls}>
                              Password <span className="text-primary">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleSuggestPassword}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors py-0.2 px-1.5 rounded-md bg-primary/10 hover:bg-primary/15 border border-primary/20 cursor-pointer"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              Suggest Strong
                            </button>
                          </div>
                          <div className="relative">
                            <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                              <Lock className="w-3 h-3" />
                            </div>
                            <input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              maxLength={20}
                              autoComplete="new-password"
                              {...register("password", {
                                required: "Password is required",
                                minLength: {
                                  value: 6,
                                  message: "Password must be at least 6 characters",
                                },
                                maxLength: {
                                  value: 20,
                                  message: "Password cannot exceed 20 characters",
                                },
                                validate: (val) =>
                                  evaluatePassword(val).acceptable ||
                                  evaluatePassword(val).warning ||
                                  "Password must be between 6 and 20 characters and combine letters & numbers",
                              })}
                              className={`${inputBase} pl-9 pr-8`}
                              placeholder="6 to 20 chars"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted cursor-pointer"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <PasswordStrengthMeter
                            password={password || ""}
                            userInputs={[email, fullName, phone]}
                          />
                          {errors.password && (
                            <p className="text-destructive text-[10px] sm:text-[11px] mt-0.5 font-medium">
                              {errors.password.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="confirmPassword" className={labelCls}>
                            Confirm Password <span className="text-primary">*</span>
                          </label>
                          <div className="relative">
                            <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                              <Lock className="w-3 h-3" />
                            </div>
                            <input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              maxLength={20}
                              autoComplete="new-password"
                              {...register("confirmPassword", {
                                required: "Please confirm your password",
                                validate: (value) => value === password || "Passwords do not match",
                              })}
                              className={`${inputBase} pl-9 pr-8`}
                              placeholder="Re-enter password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted cursor-pointer"
                              aria-label={
                                showConfirmPassword
                                  ? "Hide confirm password"
                                  : "Show confirm password"
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {confirmPassword && password && confirmPassword === password && (
                            <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Passwords match
                            </p>
                          )}
                          {errors.confirmPassword && (
                            <p className="text-destructive text-[10px] sm:text-[11px] mt-0.5 font-medium">
                              {errors.confirmPassword.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Community, Residence & Terms ────────── */}
                {step === 2 && (
                  <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-200">
                    {/* Single unified card: Community Selection */}
                    <div className="bg-card/90 backdrop-blur-md p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-border/80 space-y-2.5 shadow-md shadow-black/5">
                      {/* Community Type Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={labelCls}>Community Type</label>
                          <span className="text-[9.5px] sm:text-[10px] text-primary font-bold px-1.5 py-0.2 rounded-md bg-primary/10 border border-primary/20">
                            {communityTypes.find(t => t.value === communityType)?.label ?? "Apartment"}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {communityTypes.map((type) => {
                            const isApartment = type.value === "apartment";
                            return (
                              <label
                                key={type.value}
                                className={`relative flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-2 py-1.5 px-1.5 sm:px-2.5 border-1.5 rounded-lg sm:rounded-xl transition-all duration-200 select-none font-bold ${
                                  isApartment
                                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/15 cursor-pointer shadow-xs"
                                    : "border-border/60 bg-muted/20 text-muted-foreground/60 opacity-60 cursor-not-allowed"
                                }`}
                              >
                                <input
                                  type="radio"
                                  value={type.value}
                                  disabled={!isApartment}
                                  {...register("communityType")}
                                  className="sr-only"
                                />
                                <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 ${
                                  isApartment ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                }`}>
                                  <type.icon className="w-2.5 h-2.5" />
                                </div>
                                <span className="text-[11px] sm:text-xs">{type.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Society / Campus Dropdown */}
                      <SearchableDropdown
                        id="communityCode"
                        label="Select Your Society / Campus"
                        required
                        placeholder="Choose your community..."
                        searchPlaceholder="Search community by name or city..."
                        value={selectedCommunityId}
                        options={communities.map((c) => ({
                          value: String(c.id),
                          label: c.name,
                          sublabel: `${c.city || ""}${c.state ? `, ${c.state}` : ""} · Code: ${c.inviteCode || c.code}`,
                          badge: c.city || undefined,
                        }))}
                        onChange={handleCommunityChange}
                        disabled={isLoadingCommunities}
                        icon={Building2}
                        error={errors.communityCode?.message}
                      />

                      {/* User Type: Owner or Tenant */}
                      <div>
                        <label className={labelCls}>
                          I am registering as <span className="text-primary">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setValue("userType", "Owner", { shouldValidate: true })}
                            className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                              userType === "Owner"
                                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 font-bold shadow-xs"
                                : "border-border hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                userType === "Owner" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                              }`}>
                                <Home className="w-3 h-3" />
                              </div>
                              <div>
                                <p className="text-xs leading-none">Owner</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5 leading-none">Property owner</p>
                              </div>
                            </div>
                            {userType === "Owner" && <Check className="w-3 h-3 text-primary stroke-[3]" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setValue("userType", "Tenant", { shouldValidate: true })}
                            className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                              userType === "Tenant"
                                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 font-bold shadow-xs"
                                : "border-border hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                userType === "Tenant" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                              }`}>
                                <Users className="w-3 h-3" />
                              </div>
                              <div>
                                <p className="text-xs leading-none">Tenant</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5 leading-none">Rental resident</p>
                              </div>
                            </div>
                            {userType === "Tenant" && <Check className="w-3 h-3 text-primary stroke-[3]" />}
                          </button>
                        </div>
                      </div>

                      {/* 2 Cascading Searchable Dropdowns: Block -> Flat Number */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                        {/* 1. Block Searchable Dropdown */}
                        <SearchableDropdown
                          id="blockSelect"
                          label="Block / Tower / Wing"
                          required
                          placeholder="Select block..."
                          searchPlaceholder="Search block (e.g. A, B)..."
                          value={block}
                          options={blockConfigs.map((bc) => ({
                            value: bc.blockName,
                            label: `Block ${bc.blockName}`,
                            sublabel: `${bc.totalFloors || 10} Floors · ${bc.totalFlats || (bc.totalFloors || 10) * (bc.flatsPerFloor || 11)} Flats`,
                            badge: `${bc.totalFlats || (bc.totalFloors || 10) * (bc.flatsPerFloor || 11)} flats`,
                          }))}
                          onChange={(bName) => {
                            setValue("block", bName, { shouldValidate: true });
                            setValue("flatNo", "", { shouldValidate: false });
                            setSelectedFloor("");
                            clearErrors(["block", "flatNo"]);
                          }}
                          disabled={isLoadingBlocks || !selectedCommunityId}
                          disabledHint={!selectedCommunityId ? "Select a community first" : "Loading block layouts..."}
                          icon={Layers}
                          error={errors.block?.message}
                        />

                        {/* 2. Flat Number Searchable Dropdown */}
                        <SearchableDropdown
                          id="flatNoSelect"
                          label="Flat / Unit Number"
                          required
                          placeholder={block ? `Select flat in Block ${block}...` : "Select block first..."}
                          searchPlaceholder={`Search flat in Block ${block || ""}...`}
                          value={flatNo}
                          options={availableFlats.map((fNo) => {
                            const flNum = Math.floor(parseInt(fNo, 10) / 100);
                            return {
                              value: fNo,
                              label: `Flat ${fNo}`,
                              sublabel: flNum > 0 ? `Floor ${flNum}` : undefined,
                              badge: flNum > 0 ? `Floor ${flNum}` : undefined,
                            };
                          })}
                          onChange={(fNo) => {
                            setValue("flatNo", fNo, { shouldValidate: true });
                            clearErrors("flatNo");
                            const num = parseInt(fNo, 10);
                            if (!isNaN(num) && num >= 100) {
                              setSelectedFloor(Math.floor(num / 100));
                            }
                          }}
                          disabled={!block}
                          disabledHint="Select a block first"
                          icon={Home}
                          error={errors.flatNo?.message}
                        />
                      </div>

                      {/* Fast Unit Search bar across entire society */}
                      <div className="relative pt-0.5" ref={flatSearchContainerRef}>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                            <Search className="w-2.5 h-2.5 text-primary" />
                            <span>Or Fast Search Flat Number</span>
                          </label>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={flatSearchQuery}
                            onFocus={() => setShowFlatSearchMenu(true)}
                            onChange={(e) => {
                              setFlatSearchQuery(e.target.value);
                              setShowFlatSearchMenu(true);
                            }}
                            placeholder="Type flat number (e.g. 102, C-204, 305)..."
                            className="w-full h-8 px-2.5 pl-7 bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-lg text-[11px] placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none font-medium transition-all"
                          />
                          <Search className="w-3 h-3 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          {flatSearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setFlatSearchQuery("");
                                setShowFlatSearchMenu(false);
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Quick Search Suggestions Popover */}
                        {showFlatSearchMenu && flatSearchQuery.trim() && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                            {matchingFlats.length === 0 ? (
                              <div className="py-2 text-center text-[10.5px] text-muted-foreground font-medium">
                                No flats found matching "{flatSearchQuery}"
                              </div>
                            ) : (
                              matchingFlats.map((item) => (
                                <button
                                  key={`${item.block}-${item.flatNo}`}
                                  type="button"
                                  onClick={() => selectQuickFlat(item)}
                                  className="w-full px-2 py-1 rounded-md text-[10.5px] flex items-center justify-between text-left hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-4.5 h-4.5 rounded-md bg-primary/15 text-primary font-bold flex items-center justify-center text-[9px]">
                                      {item.block}
                                    </span>
                                    <p className="font-bold text-foreground">Flat {item.flatNo} <span className="text-[9px] text-muted-foreground font-normal">· Floor {item.floor}</span></p>
                                  </div>
                                  <span className="text-[8.5px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 rounded-md">
                                    Select
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* Dynamic Compact Unit Selection Confirmation */}
                      {block && flatNo ? (
                        <div className="bg-emerald-500/10 rounded-lg border border-emerald-500/25 px-2.5 py-1.5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Selected: Block {block} · Flat {flatNo} ({userType || "Owner"})</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground">Admin will verify</span>
                        </div>
                      ) : (
                        <div className="bg-primary/5 rounded-lg border border-primary/15 px-2.5 py-1.5 flex items-start gap-1.5">
                          <ShieldCheck className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          <p className="text-[9.5px] text-foreground/80 leading-tight font-medium">
                            Your residence unit and occupancy status will be verified by your community admin upon registration.
                          </p>
                        </div>
                      )}

                      {/* Terms of Service & Privacy Policy Checkbox */}
                      <div className="pt-1 border-t border-border/60">
                        <label className="flex items-start gap-2 cursor-pointer select-none group">
                          <input
                            type="checkbox"
                            {...register("terms", {
                              required: "You must agree to the terms to continue",
                            })}
                            className="mt-0.5 w-3.5 h-3.5 accent-primary bg-slate-50 dark:bg-slate-900 border-border rounded focus:ring-primary/30 cursor-pointer shrink-0"
                          />
                          <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed font-medium">
                            I agree to the{" "}
                            <span className="text-primary font-bold underline underline-offset-2">
                              Terms of Service
                            </span>{" "}
                            and{" "}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowPrivacyModal(true);
                              }}
                              className="text-primary font-bold underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer inline p-0 bg-transparent border-none"
                            >
                              Privacy Policy
                            </button>
                            .
                          </span>
                        </label>
                        {errors.terms && (
                          <p className="text-destructive text-[10px] sm:text-[11px] mt-0.5 ml-5 font-medium">
                            {errors.terms.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Navigation Actions (Back / Continue / Submit) ── */}
                <div className="flex items-center gap-2.5 pt-1.5">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={back}
                      className="h-9 sm:h-10 flex items-center gap-1 px-3.5 sm:px-4 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-card text-xs font-bold text-foreground hover:bg-muted/50 transition-all cursor-pointer shadow-2xs"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  )}

                  {step < 2 ? (
                    <button
                      type="button"
                      onClick={advance}
                      disabled={isSendingSignupOtp}
                      className="flex-1 h-9 sm:h-10 flex items-center justify-center gap-1.5 px-4 bg-gradient-to-r from-primary via-indigo-600 to-violet-600 hover:opacity-95 active:scale-[0.99] text-white font-bold text-xs rounded-lg sm:rounded-xl shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 transition-all duration-200 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed"
                    >
                      {isSendingSignupOtp ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Code…</span>
                        </>
                      ) : (
                        <>
                          <span>Continue to Residence Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      id="signup-submit-btn"
                      disabled={isSubmitting}
                      className="flex-1 h-9 sm:h-10 flex items-center justify-center gap-1.5 px-4 bg-gradient-to-r from-primary via-indigo-600 to-violet-600 hover:opacity-95 active:scale-[0.99] text-white font-bold text-xs rounded-lg sm:rounded-xl shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 transition-all duration-200 disabled:opacity-65 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Complete Registration</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>

              {/* Footer Sign-in Link */}
              <div className="mt-2.5 sm:mt-3.5 pt-2 border-t border-border/80 text-center">
                <p className="text-[10.5px] sm:text-[11px] text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary hover:text-primary/80 font-bold transition-colors ml-0.5"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </>
          ) : (
            /* ── SUCCESS CELEBRATION SCREEN ────────── */
            <div className="flex flex-col items-center text-center py-5 sm:py-8 px-4 animate-in fade-in-50 zoom-in-95 duration-300">
              <div className="relative mb-3 sm:mb-5">
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-primary to-indigo-600 shadow-2xl shadow-primary/30">
                  <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                </div>
                <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-primary pointer-events-none" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-2 sm:mb-3">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="text-[11px] sm:text-xs font-bold">Registration Submitted!</span>
              </div>

              <h2 className="text-xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-1 sm:mb-1.5">
                Welcome, {fullName?.split(" ")[0] || "Resident"}! 🎉
              </h2>
              <p className="text-[11px] sm:text-sm text-muted-foreground max-w-sm leading-relaxed mb-4 sm:mb-5">
                Your resident profile for{" "}
                <strong className="text-foreground">
                  {block ? `Block ${block}` : ""} {flatNo ? `Flat ${flatNo}` : ""}
                </strong>{" "}
                has been registered successfully.
              </p>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full max-w-sm py-2.5 sm:py-3 px-6 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-primary to-indigo-600 shadow-md shadow-primary/25 hover:opacity-95 transition-all cursor-pointer"
              >
                Continue to App
              </button>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="border-t border-border px-4 sm:px-8 py-2 sm:py-3 flex items-center justify-between gap-1.5 text-muted-foreground text-[10px] sm:text-[11px] bg-background/50 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
            <span>Verified resident portal</span>
          </div>
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="flex items-center gap-1 text-primary hover:text-primary/80 font-bold transition-colors cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span>Privacy Note</span>
          </button>
        </div>
      </div>

      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
}
