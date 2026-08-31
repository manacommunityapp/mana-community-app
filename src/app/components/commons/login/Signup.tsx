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
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../../../contexts/AuthContext";
import { communityService } from "../../../../services/community/communityService";
import { authService } from "../../../../services/common/authService";
import type { CommunityResponse, BlockConfigResponse } from "../../../../types/api";
import { PasswordStrengthMeter } from "../PasswordStrengthMeter";
import { evaluatePassword, generateStrongPassword } from "../../../../utils/passwordStrength";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

type SignupFormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  communityType: string;
  communityCode: string;
  userType: string;
  dateOfBirth: string;
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
      className="hidden lg:flex flex-col justify-between relative overflow-hidden h-screen sticky top-0 text-white p-8 xl:p-10 select-none border-r border-white/10"
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
        <div className="flex items-center gap-3 mb-6 xl:mb-8">
          <div className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/25 shadow-lg shadow-black/10">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-extrabold text-lg tracking-tight leading-none">Mana Community</p>
            <p className="text-indigo-200 text-xs font-medium mt-1">Your neighborhood, connected</p>
          </div>
        </div>

        {/* Hero copy */}
        <div className="mb-6 xl:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="text-xs font-bold text-amber-100 tracking-wide">
              Resident Registration Portal
            </span>
          </div>
          <h2 className="text-white leading-[1.15] mb-2.5 text-2xl xl:text-3xl font-black tracking-tight">
            Your community,
            <br />
            <span className="text-amber-300">at your fingertips.</span>
          </h2>
          <p className="text-indigo-100/80 text-xs xl:text-sm leading-relaxed max-w-sm">
            Join thousands of residents enjoying seamless event bookings, live announcements, and digital passes.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2">
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-2 group">
              <div className="w-5 h-5 rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/15 mt-0.5 shadow-xs">
                <Icon className="w-3.5 h-3.5 text-amber-200" />
              </div>
              <p className="text-indigo-50/90 text-xs xl:text-[12px] leading-snug font-medium pt-1">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resident Testimonial & Security Badge */}
      <div className="relative z-10 space-y-3 pt-4 border-t border-white/10">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-3.5 xl:p-4 shadow-lg shadow-black/5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex -space-x-2">
              {["#4f46e5", "#818cf8", "#10b981", "#ec4899"].map((c, i) => (
                <div
                  key={i}
                  className="w-5.5 h-5.5 rounded-full border-2 border-white/60 flex items-center justify-center text-[8.5px] font-bold text-white shadow-xs"
                  style={{ background: c }}
                >
                  {["R", "K", "S", "P"][i]}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-3 h-3 fill-amber-300 text-amber-300" />
              ))}
            </div>
          </div>
          <p className="text-indigo-50/90 text-[11px] xl:text-xs leading-relaxed italic">
            "Booking Ganesh Pooja seva for my family was so easy — scanned the QR at the gate and walked straight in!"
          </p>
          <p className="text-amber-200 text-[10px] xl:text-[11px] font-semibold mt-1"> Lakshmi's Emperia</p>
        </div>

        <div className="flex items-center justify-between text-indigo-200/70 text-[11px] px-1">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
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
  { label: "Community", short: "1" },
  { label: "Personal", short: "2" },
  { label: "Verify", short: "3" },
  { label: "Residence", short: "4" },
  { label: "Security", short: "5" },
];

function StepBar({
  currentStep,
  onStepClick,
}: {
  currentStep: Step;
  onStepClick: (step: Step) => void;
}) {
  return (
    <div className="flex items-center gap-0 mb-3 sm:mb-5 xl:mb-6">
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
              className={`flex flex-col items-center gap-0.5 sm:gap-1 select-none transition-all outline-none ${
                isClickable ? "cursor-pointer group" : "cursor-default"
              }`}
            >
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 xl:w-8 xl:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-300 shrink-0 ${
                  isDone
                    ? "bg-primary text-white shadow-md shadow-primary/20 group-hover:scale-105"
                    : isActive
                    ? "bg-primary text-white ring-2 sm:ring-4 ring-primary/25 shadow-md shadow-primary/25 scale-105"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {isDone ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" /> : num}
              </div>
              <span
                className={`text-[9.5px] sm:text-[10.5px] xl:text-[11px] font-semibold hidden sm:block transition-colors ${
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
                className={`flex-1 h-[2px] mx-1 sm:mx-2 rounded-full transition-all duration-500 ${
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
    <div className="flex items-center gap-2 pb-1.5 mb-2.5 sm:mb-3.5 border-b border-border/80">
      <div className="w-5 h-5 sm:w-6.5 sm:h-6.5 rounded-md sm:rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shrink-0 bg-gradient-to-tr from-primary to-indigo-500 shadow-xs shadow-primary/20">
        {num}
      </div>
      <div>
        <p className="text-xs sm:text-sm font-bold text-foreground leading-none">{title}</p>
        <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{sub}</p>
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
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-0.5 sm:mb-1">
        <label htmlFor={id} className="block text-[10px] sm:text-xs font-semibold text-foreground/80 uppercase tracking-wide">
          {label} {required && "*"}
        </label>
        {selectedOpt && (
          <span className="text-[9px] sm:text-[10px] text-primary font-bold">
            {selectedOpt.badge || selectedOpt.label}
          </span>
        )}
      </div>

      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full py-1.5 sm:py-2.5 px-3 bg-[var(--mana-bg-input)] border ${
          error ? "border-destructive ring-1 ring-destructive/20" : isOpen ? "border-primary ring-2 ring-primary/25" : "border-border"
        } rounded-xl text-foreground flex items-center justify-between transition-all text-xs sm:text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
          <span className={`truncate ${selectedOpt ? "font-bold text-foreground" : "text-muted-foreground/60"}`}>
            {selectedOpt ? selectedOpt.label : disabled && disabledHint ? disabledHint : placeholder}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0 ml-1.5 ${isOpen ? "rotate-180 text-primary" : ""}`} />
      </button>

      {error && <p className="text-destructive text-[10px] sm:text-xs mt-0.5 sm:mt-1">{error}</p>}
      {!disabled && !error && disabledHint && !value && (
        <p className="text-[10px] text-muted-foreground mt-0.5 sm:mt-1">{disabledHint}</p>
      )}

      {/* Popover Dropdown with Search */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-64">
          {/* Search filter input inside dropdown */}
          <div className="p-2 border-b border-border bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs py-1 px-1 text-foreground placeholder:text-muted-foreground/60 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-48 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
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
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white font-bold shadow-xs"
                        : "hover:bg-accent text-foreground"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{opt.label}</p>
                      {opt.sublabel && (
                        <p className={`text-[10px] truncate ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                          {opt.sublabel}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-2 shrink-0 text-white" />}
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
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [isLoadingCommunities, setIsLoadingCommunities] = useState<boolean>(true);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState<boolean>(false);
  const [selectedFloor, setSelectedFloor] = useState<number | "">("");
  const [blockConfigs, setBlockConfigs] = useState<BlockConfigResponse[]>(DEFAULT_BLOCK_CONFIGS);
  const [flatSearchQuery, setFlatSearchQuery] = useState<string>("");
  const [showFlatSearchMenu, setShowFlatSearchMenu] = useState<boolean>(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSendingSignupOtp, setIsSendingSignupOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const flatSearchContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const signupOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    mode: "onChange",
    defaultValues: {
      communityType: "apartment",
      userType: "Owner",
      gender: "MALE",
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

  const handleSignupOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const sanitized = value.replace(/\D/g, "").slice(0, 6);
      if (sanitized.length > 0) {
        const next = [...otpDigits];
        for (let i = 0; i < 6; i++) next[i] = sanitized[i] || "";
        setOtpDigits(next);
        signupOtpInputRefs.current[Math.min(sanitized.length, 5)]?.focus();
        return;
      }
    }
    const cleanChar = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = cleanChar;
    setOtpDigits(next);
    if (cleanChar && index < 5) signupOtpInputRefs.current[index + 1]?.focus();
  };

  const handleSignupOtpKeyDown = (index: number, e: { key: string }) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      signupOtpInputRefs.current[index - 1]?.focus();
    }
  };

  const sendSignupOtpEmail = async () => {
    setIsSendingSignupOtp(true);
    try {
      await authService.sendSignupOtp(email, phone);
      setResendCooldown(60);
      setTimeout(() => signupOtpInputRefs.current[0]?.focus(), 150);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send verification code";
      toast.error(message);
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
      setCommunities(data || []);
    } catch (err: any) {
      setCommunitiesError(err?.message || "Could not load communities. Please try again.");
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
    if (s === 1) {
      const valid = await trigger(["communityType", "communityCode"]);
      if (!communityCode?.trim()) {
        setError("communityCode", { type: "manual", message: "Please select a community above to obtain invite code" });
        return false;
      }
      return valid;
    }
    if (s === 2) {
      const valid = await trigger(["fullName", "email", "phone", "dateOfBirth", "gender"]);
      return valid && phone?.length === 10;
    }
    if (s === 3) {
      const code = otpDigits.join("");
      if (code.length < 6 || otpDigits.some((d) => d === "")) {
        toast.error("Please enter the complete 6-digit verification code");
        return false;
      }
      return true;
    }
    if (s === 4) {
      if (communityType === "apartment") {
        if (!block) {
          setError("block", { type: "manual", message: "Please select a block" });
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
    if (s === 5) {
      const valid = await trigger(["password", "confirmPassword", "terms"]);
      return valid;
    }
    return true;
  };

  const advance = async () => {
    const isValid = await validateCurrentStep(step);
    if (!isValid) return;

    if (step === 2) {
      setIsSendingSignupOtp(true);
      try {
        await authService.sendSignupOtp(email, phone);
        setOtpDigits(["", "", "", "", "", ""]);
        setResendCooldown(60);
        setStep(3);
        formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => signupOtpInputRefs.current[0]?.focus(), 200);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send verification code";
        toast.error(message);
      } finally {
        setIsSendingSignupOtp(false);
      }
      return;
    }

    if (step < 5) {
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
          setStep(4);
          return;
        }
      }

      await registerUser({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        inviteCode: data.communityCode,
        password: data.password,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        block: data.block,
        flatNo: data.flatNo,
        userType: data.userType || "Owner",
        occupancyStatus: data.userType || "Owner",
        emailOtpCode: otpDigits.join(""),
      });

      toast.success("Account created! Welcome to the community.");
      setStep(6);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
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
    { title: "Join your community", sub: "Community Setup · Step 1 of 5" },
    { title: "Tell us about yourself", sub: "Personal Details · Step 2 of 5" },
    { title: "Verify your email", sub: "Email Verification · Step 3 of 5" },
    { title: "Where do you live?", sub: "Unit & Residence · Step 4 of 5" },
    { title: "Secure your account", sub: "Account Security · Step 5 of 5" },
  ];

  const inputBase =
    "w-full py-1.5 sm:py-2.5 bg-[var(--mana-bg-input)] border border-border rounded-xl text-foreground placeholder:text-muted-foreground/45 focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all text-xs sm:text-sm";
  const labelCls = "block text-[10px] sm:text-xs font-semibold text-foreground/80 mb-1 uppercase tracking-wide";

  return (
    <div className="h-screen w-screen flex bg-background text-foreground selection:bg-primary/20 overflow-hidden">
      <Toaster position="top-center" richColors />

      {/* Left Brand Showcase Panel (Desktop Browser) */}
      <div className="lg:w-[420px] xl:w-[480px] 2xl:w-[520px] shrink-0">
        <BrandPanel />
      </div>

      {/* Right Multi-Step Form Panel (Browser Viewport) */}
      <div
        className="flex-1 flex flex-col justify-between bg-background h-full overflow-y-auto relative"
        ref={formRef}
      >
        {/* Subtle radial ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none -z-0" />

        {/* Mobile top header branding */}
        <div className="lg:hidden px-4 py-2 flex items-center gap-2.5 border-b border-border bg-card/60 backdrop-blur-sm shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary text-white shadow-xs shadow-primary/25">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground leading-tight">Mana Community</p>
            <p className="text-[10px] text-muted-foreground">Resident Registration</p>
          </div>
        </div>

        {/* Form Container: Expanded max-width for clear browser view without unnecessary vertical scrolling */}
        <div className="px-3.5 sm:px-8 lg:px-12 xl:px-16 py-2 sm:py-5 lg:py-7 max-w-[780px] xl:max-w-[840px] 2xl:max-w-[900px] w-full mx-auto relative z-10 flex-1 flex flex-col justify-center">
          {step < 6 ? (
            <>
              {/* Header Title & Subtitle */}
              <div className="mb-2.5 sm:mb-4 xl:mb-5">
                <h2 className="text-base sm:text-xl font-bold text-foreground tracking-tight mb-0.5">
                  {STEP_HEADINGS[step - 1].title}
                </h2>
                <p className="text-[11px] sm:text-sm text-muted-foreground">
                  {STEP_HEADINGS[step - 1].sub}
                </p>
              </div>

              {/* Progress Step Bar */}
              <StepBar currentStep={step} onStepClick={(s) => setStep(s)} />

              {/* Form Body */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && step < 5 && (e.target as HTMLElement).tagName !== "BUTTON") {
                    e.preventDefault();
                    advance();
                  }
                }}
                className="space-y-3 sm:space-y-4 xl:space-y-5"
              >
                {/* ── STEP 1: Community Setup (Join your community) ─── */}
                {step === 1 && (
                  <div className="space-y-2.5 sm:space-y-3.5 animate-in fade-in duration-200">
                    <SectionHead
                      num={1}
                      title="Select Your Community"
                      sub="Choose your community type and select your society"
                    />

                    {/* Single unified card for Community Type + Society Selection */}
                    <div className="bg-card p-3 sm:p-4 xl:p-5 rounded-xl sm:rounded-2xl border border-border space-y-2.5 sm:space-y-4 shadow-sm">
                      {/* Community Type Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <label className={labelCls}>Community Type</label>
                          <span className="text-[10px] sm:text-[11px] text-primary font-medium">
                            {communityTypes.find(t => t.value === communityType)?.label ?? "Apartment"} selected
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                          {communityTypes.map((type) => {
                            const isApartment = type.value === "apartment";
                            return (
                              <label
                                key={type.value}
                                className={`relative flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-2 py-2.5 sm:py-2.5 px-1.5 sm:px-3 border rounded-lg sm:rounded-xl transition-all select-none font-semibold ${
                                  isApartment
                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30 cursor-pointer shadow-xs"
                                    : "border-border/50 bg-muted/20 text-muted-foreground/70 opacity-60 cursor-not-allowed"
                                }`}
                              >
                                <input
                                  type="radio"
                                  value={type.value}
                                  disabled={!isApartment}
                                  {...register("communityType")}
                                  className="sr-only"
                                />
                                <type.icon className={`w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0 ${isApartment ? "text-primary" : "text-muted-foreground"}`} />
                                <span className="text-[9px] sm:text-xs leading-tight text-center">{type.label}</span>
                                {isApartment ? (
                                  <Check className="w-3 h-3 text-primary shrink-0 stroke-[3] sm:ml-auto" />
                                ) : (
                                  <span className="text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 rounded-full bg-muted text-muted-foreground uppercase border border-border/60">
                                    Soon
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Society selection dropdown & invite code */}
                      <div className="border-t border-border/70 pt-2.5 sm:pt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4 xl:gap-5">
                        {/* Dropdown */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="communitySelect" className={labelCls}>
                              Select Your Society / Campus
                            </label>
                            {isLoadingCommunities && (
                              <span className="text-[10px] text-primary flex items-center gap-1 font-medium">
                                <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <Building2 className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <select
                              id="communitySelect"
                              value={selectedCommunityId}
                              onChange={(e) => handleCommunityChange(e.target.value)}
                              disabled={isLoadingCommunities}
                              className={`${inputBase} pl-10 pr-8 appearance-none cursor-pointer disabled:opacity-60`}
                            >
                              <option value="">
                                {isLoadingCommunities
                                  ? "Loading communities from database..."
                                  : "Choose your community..."}
                              </option>
                              {communities.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} {c.city ? `(${c.city})` : ""}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground w-4 h-4" />
                          </div>
                          {communitiesError ? (
                            <div className="flex items-center justify-between text-[11px] text-destructive mt-1.5">
                              <span>{communitiesError}</span>
                              <button
                                type="button"
                                onClick={loadCommunities}
                                className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" /> Retry
                              </button>
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground mt-1.5">
                              {communities.length > 0
                                ? `Retrieved ${communities.length} ${
                                    communities.length === 1 ? "community" : "communities"
                                  } from database`
                                : "Select community to auto-fill invite code"}
                            </p>
                          )}
                        </div>

                        {/* Invite Code (Read-Only) */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="communityCode" className={labelCls}>
                              Community Invite Code
                            </label>
                            {selectedCommunityId ? (
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Auto-filled
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Locked
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              id="communityCode"
                              type="text"
                              readOnly
                              {...register("communityCode", {
                                required: "Please select a community above to obtain invite code",
                              })}
                              className={`${inputBase} pl-10 pr-10 bg-muted/40 text-muted-foreground/90 border-border cursor-not-allowed select-none font-mono uppercase tracking-wider font-semibold ${
                                selectedCommunityId
                                  ? "bg-primary/5 text-primary border-primary/40 font-bold"
                                  : ""
                              }`}
                              placeholder="Auto-assigned upon community selection"
                            />
                            {selectedCommunityId && (
                              <CheckCircle2 className="w-4 h-4 text-primary absolute right-3.5 top-1/2 -translate-y-1/2" />
                            )}
                          </div>
                          {errors.communityCode && (
                            <p className="text-destructive text-xs mt-1">
                              {errors.communityCode.message}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-1.5">
                            {selectedCommunityId
                              ? "✓ Auto-populated from selected society (read-only)"
                              : "Select your society above to automatically populate this code"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Personal Details ───────────────────────── */}
                {step === 2 && (
                  <div className="space-y-2.5 sm:space-y-3.5 animate-in fade-in duration-200">
                    <SectionHead
                      num={2}
                      title="Personal Details"
                      sub="Tell us who you are so your profile can be created"
                    />

                    {/* Full Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3.5 xl:gap-4">
                      <div>
                        <label htmlFor="fullName" className={labelCls}>
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="fullName"
                            type="text"
                            {...register("fullName", { required: "Full name is required" })}
                            className={`${inputBase} pl-9 sm:pl-10 pr-3`}
                            placeholder="John Doe"
                          />
                        </div>
                        {errors.fullName && (
                          <p className="text-destructive text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                            {errors.fullName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="signup-email" className={labelCls}>
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="signup-email"
                            type="email"
                            {...register("email", {
                              required: "Email address is required",
                              pattern: {
                                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                message:
                                  "Please enter a valid email address (e.g. name@example.com)",
                              },
                            })}
                            className={`${inputBase} pl-9 sm:pl-10 pr-3`}
                            placeholder="john@example.com"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-destructive text-[10px] sm:text-xs mt-0.5 sm:mt-1">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Phone & Date of Birth */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3.5 xl:gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                          <label htmlFor="phone" className={labelCls}>
                            Phone Number
                          </label>
                          <span className="text-[9.5px] sm:text-[10px] text-muted-foreground font-medium">
                            10 digits
                          </span>
                        </div>
                        <div className="relative flex items-center">
                          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="phone"
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            {...register("phone", {
                              required: "Phone number is required",
                              pattern: {
                                value: /^[6-9]\d{9}$/,
                                message:
                                  "Enter a valid 10-digit Indian mobile number",
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
                            className={`${inputBase} pl-9 sm:pl-10 pr-3 tracking-wider font-medium`}
                            placeholder="9876543210"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-destructive text-[10px] sm:text-xs mt-0.5 sm:mt-1">{errors.phone.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="dateOfBirth" className={labelCls}>
                          Date of Birth
                        </label>
                        <div className="relative">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="dateOfBirth"
                            type="date"
                            max={(() => {
                              const y = new Date();
                              y.setDate(y.getDate() - 1);
                              return y.toISOString().split("T")[0];
                            })()}
                            {...register("dateOfBirth", {
                              required: "Date of birth is required",
                              validate: (v) => {
                                if (!v) return "Date of birth is required";
                                const dob = new Date(v);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                if (dob >= today) return "Date of birth cannot be today or a future date";
                                return true;
                              },
                            })}
                            className={`${inputBase} pl-9 sm:pl-10 pr-3`}
                          />
                        </div>
                        {errors.dateOfBirth && (
                          <p className="text-destructive text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                            {errors.dateOfBirth.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <label htmlFor="gender" className={labelCls}>
                        Gender
                      </label>
                      <div className="relative">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          id="gender"
                          {...register("gender")}
                          className={`${inputBase} pl-9 sm:pl-10 pr-8 appearance-none cursor-pointer`}
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other / Prefer not to say</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Email OTP Verification ────────────────── */}
                {step === 3 && (
                  <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-200">
                    <SectionHead
                      num={3}
                      title="Email Verification"
                      sub="Enter the 6-digit code sent to your email address"
                    />

                    {/* Email badge */}
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Code sent to</p>
                          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={back}
                        className="text-xs text-primary hover:underline font-medium shrink-0 cursor-pointer bg-transparent border-none p-1"
                      >
                        Change
                      </button>
                    </div>

                    {/* 6-digit OTP inputs */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-foreground/80 mb-2 uppercase tracking-wide">
                        6-Digit Verification Code
                      </label>
                      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => { signupOtpInputRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleSignupOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleSignupOtpKeyDown(idx, e)}
                            onPaste={(e) => {
                              e.preventDefault();
                              handleSignupOtpChange(idx, e.clipboardData.getData("text"));
                            }}
                            className="flex-1 h-11 sm:h-12 text-center text-base sm:text-lg font-bold bg-[var(--mana-bg-input)] border border-border rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                          />
                        ))}
                      </div>

                      {/* Resend */}
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          Didn't receive the code?
                        </span>
                        <button
                          type="button"
                          onClick={sendSignupOtpEmail}
                          disabled={resendCooldown > 0 || isSendingSignupOtp}
                          className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-transparent border-none"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSendingSignupOtp ? "animate-spin" : ""}`} />
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                        </button>
                      </div>
                    </div>

                    <div className="bg-primary/5 rounded-lg sm:rounded-xl border border-primary/15 p-2 sm:p-2.5 flex items-start gap-2 sm:gap-3">
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-[10.5px] sm:text-xs text-foreground/80 leading-relaxed">
                        Verifying your email helps keep your account secure and ensures you receive important community notifications.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Residence Location (Apartment) ────────── */}
                {step === 4 && (
                  <div className="space-y-2.5 sm:space-y-3.5 animate-in fade-in duration-200">
                    <SectionHead
                      num={4}
                      title="Unit & Residence"
                      sub="Specify your user type, block, and flat number"
                    />

                    {/* Dynamic Visual Unit Preview Badge */}
                    {(block || flatNo || userType) && (
                      <div className="flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 animate-in fade-in zoom-in-95">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center text-white text-xs sm:text-sm font-black bg-gradient-to-tr from-primary to-indigo-600 shadow-xs shadow-primary/25 shrink-0">
                          {block || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs sm:text-sm font-bold text-foreground">
                              {block ? `Block ${block}` : "Block ?"}
                              {flatNo ? ` · Flat ${flatNo}` : " · Flat ?"}
                            </p>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                              {userType || "Owner"}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                            {activeBlockConfig
                              ? `${activeBlockConfig.blockName} Block (${activeBlockConfig.totalFloors} floors, ${activeBlockConfig.flatsPerFloor} flats/floor — total ${activeBlockConfig.totalFlats} flats)`
                              : "Select your user type, block, and flat"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* User Type (Owner / Tenant) Selector */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wide">
                        User Type <span className="text-destructive">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                        <button
                          type="button"
                          onClick={() => setValue("userType", "Owner", { shouldValidate: true })}
                          className={`p-3 rounded-xl border-2 text-left transition-all flex items-start gap-2.5 sm:gap-3 relative overflow-hidden cursor-pointer ${
                            userType === "Owner"
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                              : "border-border bg-card hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            userType === "Owner" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          }`}>
                            <Home className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-xs sm:text-sm text-foreground">Owner</p>
                              {userType === "Owner" && <Check className="w-4 h-4 text-primary" />}
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-tight">
                              Flat owner &amp; resident
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setValue("userType", "Tenant", { shouldValidate: true })}
                          className={`p-3 rounded-xl border-2 text-left transition-all flex items-start gap-2.5 sm:gap-3 relative overflow-hidden cursor-pointer ${
                            userType === "Tenant"
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                              : "border-border bg-card hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            userType === "Tenant" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          }`}>
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-xs sm:text-sm text-foreground">Tenant</p>
                              {userType === "Tenant" && <Check className="w-4 h-4 text-primary" />}
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-tight">
                              Tenant / rental resident
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Quick Smart Flat Search across all blocks & floors */}
                    <div className="relative" ref={flatSearchContainerRef}>
                      <label className="block text-[10px] sm:text-xs font-semibold text-foreground/80 mb-1 uppercase tracking-wide">
                        Quick Flat Search
                      </label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={flatSearchQuery}
                          onFocus={() => setShowFlatSearchMenu(true)}
                          onChange={(e) => {
                            setFlatSearchQuery(e.target.value);
                            setShowFlatSearchMenu(true);
                          }}
                          placeholder="Search flat number (e.g. 101, 1005, B-203)..."
                          className={`${inputBase} pl-8 sm:pl-10 pr-8`}
                        />
                        {flatSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setFlatSearchQuery("");
                              setShowFlatSearchMenu(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Quick Search Suggestions Popover */}
                      {showFlatSearchMenu && flatSearchQuery.trim() && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-1.5 space-y-0.5">
                          {matchingFlats.length === 0 ? (
                            <div className="py-3 text-center text-xs text-muted-foreground">
                              No flats found matching "{flatSearchQuery}"
                            </div>
                          ) : (
                            matchingFlats.map((item) => (
                              <button
                                key={`${item.block}-${item.flatNo}`}
                                type="button"
                                onClick={() => selectQuickFlat(item)}
                                className="w-full px-3 py-2 rounded-lg text-xs flex items-center justify-between text-left hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-md bg-primary/15 text-primary font-bold flex items-center justify-center text-[10px]">
                                    {item.block}
                                  </span>
                                  <div>
                                    <p className="font-bold text-foreground">Flat {item.flatNo}</p>
                                    <p className="text-[10px] text-muted-foreground">Floor {item.floor} · Block {item.block}</p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-semibold bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
                                  Select
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 my-1">
                      <div className="h-[1px] bg-border flex-1" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">or select below</span>
                      <div className="h-[1px] bg-border flex-1" />
                    </div>

                    {/* 2 Cascading Searchable Dropdowns: Block -> Flat Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 xl:gap-4">
                      {/* 1. Block Searchable Dropdown */}
                      <SearchableDropdown
                        id="blockSelect"
                        label="Block / Wing"
                        required
                        placeholder="Select Block"
                        searchPlaceholder="Search block name..."
                        value={block || ""}
                        icon={Layers}
                        error={errors.block?.message}
                        options={blockConfigs.map((bc) => ({
                          value: bc.blockName,
                          label: `Block ${bc.blockName}`,
                          sublabel: `${bc.totalFlats} flats across ${bc.totalFloors} floors`,
                          badge: `Block ${bc.blockName}`,
                        }))}
                        onChange={(newBlock) => {
                          setValue("block", newBlock, { shouldValidate: true });
                          setValue("flatNo", "", { shouldValidate: false });
                          clearErrors(["block", "flatNo"]);
                        }}
                      />

                      {/* 2. Flat Number Searchable Dropdown */}
                      <SearchableDropdown
                        id="flatSelect"
                        label="Flat Number"
                        required
                        disabled={!block}
                        disabledHint="Select Block First"
                        placeholder="Select Flat Number"
                        searchPlaceholder="Search flat number (e.g. 101, 1005)..."
                        value={flatNo || ""}
                        icon={Home}
                        error={errors.flatNo?.message}
                        options={availableFlats.map((flat) => ({
                          value: flat,
                          label: `Flat ${flat}`,
                          sublabel: `Block ${block}`,
                          badge: `Flat ${flat}`,
                        }))}
                        onChange={(flat) => {
                          setValue("flatNo", flat, { shouldValidate: true });
                          clearErrors(["flatNo"]);
                        }}
                      />
                    </div>

                    {/* Admin Verification Reassurance */}
                    <div className="bg-primary/5 rounded-lg sm:rounded-xl border border-primary/15 p-2 sm:p-2.5 flex items-start gap-2 sm:gap-3 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-[10.5px] sm:text-xs text-foreground/80 leading-relaxed">
                        Your residence unit and occupancy status will be verified by your community admin upon registration.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── STEP 5: Role & Security ────────────────────────── */}
                {step === 5 && (
                  <div className="space-y-2.5 sm:space-y-3.5 animate-in fade-in duration-200">
                    <SectionHead
                      num={5}
                      title="Account Security"
                      sub="Set a protected password and review terms to complete signup"
                    />

                    {/* Password Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3.5 xl:gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                          <label htmlFor="signup-password" className={labelCls}>
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={handleSuggestPassword}
                            className="inline-flex items-center gap-1 text-[10.5px] sm:text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-0.5 px-1.5 rounded-md hover:bg-primary/10 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            Suggest Strong
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            maxLength={20}
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
                            className={`${inputBase} pl-9 sm:pl-10 pr-9`}
                            placeholder="6 to 20 characters (letters & numbers)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors p-1 cursor-pointer"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                          </button>
                        </div>
                        <PasswordStrengthMeter
                          password={password || ""}
                          userInputs={[email, fullName, phone]}
                        />
                        {errors.password && (
                          <p className="text-destructive text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                            {errors.password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className={labelCls}>
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            maxLength={20}
                            {...register("confirmPassword", {
                              required: "Please confirm your password",
                              validate: (value) => value === password || "Passwords do not match",
                            })}
                            className={`${inputBase} pl-9 sm:pl-10 pr-9`}
                            placeholder="Re-enter password (max 20 characters)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors p-1 cursor-pointer"
                            aria-label={
                              showConfirmPassword
                                ? "Hide confirm password"
                                : "Show confirm password"
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                          </button>
                        </div>
                        {confirmPassword && password && confirmPassword === password && (
                          <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 sm:mt-1 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Passwords match
                          </p>
                        )}
                        {errors.confirmPassword && (
                          <p className="text-destructive text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                            {errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Terms of Service & Privacy Policy Checkbox */}
                    <div className="pt-0.5 sm:pt-1">
                      <label className="flex items-start gap-2 cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          {...register("terms", {
                            required: "You must agree to the terms to continue",
                          })}
                          className="mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 accent-primary bg-[var(--mana-bg-input)] border-border rounded focus:ring-primary/30 cursor-pointer shrink-0"
                        />
                        <span className="text-[10.5px] sm:text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight sm:leading-relaxed">
                          I agree to the{" "}
                          <span className="text-primary font-medium underline underline-offset-2">
                            Terms of Service
                          </span>{" "}
                          and{" "}
                          <span className="text-primary font-medium underline underline-offset-2">
                            Privacy Policy
                          </span>
                          .
                        </span>
                      </label>
                      {errors.terms && (
                        <p className="text-destructive text-[10px] sm:text-xs mt-0.5 ml-5">
                          {errors.terms.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Navigation Actions (Back / Continue / Submit) ── */}
                <div className="flex items-center gap-2 sm:gap-3 pt-1.5 sm:pt-2">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={back}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 xl:py-3 rounded-lg sm:rounded-xl border border-border text-[11px] sm:text-xs font-semibold text-foreground hover:bg-muted/50 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  )}

                  {step < 5 ? (
                    <button
                      type="button"
                      onClick={advance}
                      disabled={isSendingSignupOtp}
                      className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 xl:py-3.5 px-4 sm:px-6 bg-gradient-to-r from-primary via-primary to-indigo-600 hover:opacity-95 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed"
                    >
                      {isSendingSignupOtp ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Code…</span>
                        </>
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      id="signup-submit-btn"
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 xl:py-3.5 px-4 sm:px-6 bg-gradient-to-r from-primary via-primary to-indigo-600 hover:opacity-95 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 disabled:opacity-65 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create My Account</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>

              {/* Footer Sign-in Link */}
              <div className="mt-3 sm:mt-5 xl:mt-6 pt-2 sm:pt-3.5 border-t border-border/80 text-center">
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary hover:text-primary/80 font-bold transition-colors ml-1"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </>
          ) : (
            /* ── STEP 6: Success Celebration Screen ────────── */
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
        <div className="border-t border-border px-4 sm:px-8 py-2 sm:py-3 flex items-center justify-center gap-1.5 text-muted-foreground text-[10px] sm:text-[11px] bg-background/50 shrink-0">
          <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
          <span>Verified resident portal</span>
        </div>
      </div>
    </div>
  );
}
