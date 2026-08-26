import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../../../contexts/AuthContext";
import { communityService } from "../../../../services/community/communityService";
import type { CommunityResponse } from "../../../../types/api";
import { PasswordStrengthMeter } from "../PasswordStrengthMeter";
import { evaluatePassword, generateStrongPassword } from "../../../../utils/passwordStrength";

type Step = 1 | 2 | 3 | 4 | 5;

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
          <h1 className="text-white leading-[1.15] mb-2.5 text-2xl xl:text-3xl font-black tracking-tight">
            Your community,
            <br />
            <span className="text-amber-300">at your fingertips.</span>
          </h1>
          <p className="text-indigo-100/80 text-xs xl:text-sm leading-relaxed max-w-sm">
            Join thousands of residents enjoying seamless event bookings, live announcements, and digital passes.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-3">
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-3 group">
              <div className="w-7 h-7 rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/15 mt-0.5 shadow-xs">
                <Icon className="w-3.5 h-3.5 text-amber-200" />
              </div>
              <p className="text-indigo-50/90 text-xs xl:text-[13px] leading-snug font-medium pt-1">{text}</p>
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
          <p className="text-amber-200 text-[10px] xl:text-[11px] font-semibold mt-1">— Rohan K., Lakshmi's Emperia</p>
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
  { label: "Residence", short: "3" },
  { label: "Security", short: "4" },
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

// ── Main Registration / Signup Component ─────────────────────
export function Signup() {
  const [step, setStep] = useState<Step>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [isLoadingCommunities, setIsLoadingCommunities] = useState<boolean>(true);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const formRef = useRef<HTMLDivElement>(null);

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
      userType: "member",
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
  const communityType = watch("communityType");
  const communityCode = watch("communityCode");

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

  const handleCommunityChange = (communityIdStr: string) => {
    setSelectedCommunityId(communityIdStr);
    if (!communityIdStr) {
      setValue("communityCode", "", { shouldValidate: true });
      return;
    }
    const found = communities.find((c) => String(c.id) === communityIdStr);
    if (found) {
      const code = found.inviteCode || found.code || "";
      setValue("communityCode", code, { shouldValidate: true });
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
      if (communityType === "apartment") {
        const valid = await trigger(["block", "flatNo"]);
        return valid;
      }
      return true;
    }
    if (s === 4) {
      const valid = await trigger(["password", "confirmPassword", "terms"]);
      return valid;
    }
    return true;
  };

  const advance = async () => {
    const isValid = await validateCurrentStep(step);
    if (!isValid) return;

    if (step < 4) {
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
          setStep(3);
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
      });

      toast.success("Account created! Welcome to the community.");
      setStep(5);
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
    { title: "Join your community", sub: "Community Setup · Step 1 of 4" },
    { title: "Tell us about yourself", sub: "Personal Details · Step 2 of 4" },
    { title: "Where do you live?", sub: "Unit & Residence · Step 3 of 4" },
    { title: "Secure your account", sub: "Account Security · Step 4 of 4" },
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
          {step < 5 ? (
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
                  if (e.key === "Enter" && step < 4 && (e.target as HTMLElement).tagName !== "BUTTON") {
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
                      {/* Compact Side-by-Side Community Type Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <label className={labelCls}>Community Type</label>
                          <span className="text-[10px] sm:text-[11px] text-primary font-medium">Apartment selected</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                          {communityTypes.map((type) => {
                            const isApartment = type.value === "apartment";
                            return (
                              <label
                                key={type.value}
                                className={`relative flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2.5 px-2 sm:px-3 border rounded-lg sm:rounded-xl transition-all select-none text-[10.5px] sm:text-xs font-semibold ${
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
                                <type.icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${isApartment ? "text-primary" : "text-muted-foreground"}`} />
                                <span className="truncate">{type.label}</span>
                                {isApartment ? (
                                  <Check className="w-3 h-3 text-primary shrink-0 stroke-[3]" />
                                ) : (
                                  <span className="text-[8.5px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground uppercase border border-border/60">
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
                            {...register("dateOfBirth", {
                              required: "Date of birth is required",
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

                {/* ── STEP 3: Residence Location (Apartment) ────────── */}
                {step === 3 && (
                  <div className="space-y-2.5 sm:space-y-3.5 animate-in fade-in duration-200">
                    <SectionHead
                      num={3}
                      title="Unit & Residence"
                      sub="Specify your exact block and flat number"
                    />

                    {/* Dynamic Visual Unit Preview Badge */}
                    {(block || flatNo) && (
                      <div className="flex items-center gap-2.5 sm:gap-3.5 p-2 sm:p-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 animate-in fade-in zoom-in-95">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white text-xs sm:text-sm font-black bg-gradient-to-tr from-primary to-indigo-600 shadow-xs shadow-primary/25 shrink-0">
                          {block || "?"}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-foreground">
                            {block ? `Block ${block}` : "Block ?"}
                            {flatNo ? ` · Flat ${flatNo}` : " · Flat ?"}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                            Your designated community unit
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 sm:gap-3.5 xl:gap-4">
                      {/* Block / Wing (Single Letter A-Z) */}
                      <div>
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                          <label htmlFor="block" className={labelCls}>
                            Block / Wing
                          </label>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium truncate">
                            1 letter
                          </span>
                        </div>
                        <div className="relative">
                          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="block"
                            type="text"
                            {...register("block", {
                              required:
                                communityType === "apartment" ? "Block is required" : false,
                              pattern: {
                                value: /^[A-Z]$/,
                                message: "Single letter (A-Z)",
                              },
                              maxLength: {
                                value: 1,
                                message: "Single character",
                              },
                            })}
                            onKeyDown={(e) => {
                              if (
                                e.key.length === 1 &&
                                !/^[a-zA-Z]$/.test(e.key) &&
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
                                .replace(/[^a-zA-Z]/g, "")
                                .toUpperCase()
                                .slice(0, 1);
                              setValue("block", text, { shouldValidate: true });
                            }}
                            onChange={(e) => {
                              const upper = e.target.value
                                .replace(/[^a-zA-Z]/g, "")
                                .toUpperCase()
                                .slice(0, 1);
                              setValue("block", upper, { shouldValidate: true });
                            }}
                            className={`${inputBase} pl-8 sm:pl-10 pr-2 uppercase font-bold text-center tracking-widest text-sm sm:text-base`}
                            placeholder="A"
                            maxLength={1}
                          />
                        </div>
                        {errors.block && (
                          <p className="text-destructive text-[10px] sm:text-xs mt-0.5 sm:mt-1">{errors.block.message}</p>
                        )}
                      </div>

                      {/* Flat Number */}
                      <div>
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                          <label htmlFor="flatNo" className={labelCls}>
                            Flat No
                          </label>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium truncate">
                            Max 4 digits
                          </span>
                        </div>
                        <div className="relative">
                          <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="flatNo"
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            {...register("flatNo", {
                              required:
                                communityType === "apartment" ? "Flat number is required" : false,
                              pattern: {
                                value: /^\d{1,4}$/,
                                message: "Numbers only (max 4 digits)",
                              },
                              maxLength: {
                                value: 4,
                                message: "Max 4 digits",
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
                                .slice(0, 4);
                              setValue("flatNo", text, { shouldValidate: true });
                            }}
                            onChange={(e) => {
                              const numeric = e.target.value.replace(/\D/g, "").slice(0, 4);
                              setValue("flatNo", numeric, { shouldValidate: true });
                            }}
                            className={`${inputBase} pl-8 sm:pl-10 pr-2 font-medium`}
                            placeholder="101"
                          />
                        </div>
                        {errors.flatNo && (
                          <p className="text-destructive text-[10px] sm:text-xs mt-0.5 sm:mt-1">{errors.flatNo.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Admin Verification Reassurance */}
                    <div className="bg-primary/5 rounded-lg sm:rounded-xl border border-primary/15 p-2 sm:p-2.5 flex items-start gap-2 sm:gap-3 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-[10.5px] sm:text-xs text-foreground/80 leading-relaxed">
                        Your residence unit will be checked and verified by your community admin upon registration.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Role & Security ────────────────────────── */}
                {step === 4 && (
                  <div className="space-y-2.5 sm:space-y-3.5 animate-in fade-in duration-200">
                    <SectionHead
                      num={4}
                      title="Account Role & Security"
                      sub="Select your role and set a protected password"
                    />

                    {/* Account Role Cards */}
                    <div>
                      <label className={labelCls}>Account Role</label>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <label className="relative flex items-center p-2 sm:p-3 border border-primary bg-primary/10 rounded-lg sm:rounded-xl cursor-pointer transition-all shadow-xs ring-1 ring-primary/30">
                          <input
                            type="radio"
                            value="member"
                            {...register("userType")}
                            className="w-3.5 h-3.5 accent-primary"
                          />
                          <div className="ml-2 sm:ml-3">
                            <p className="text-[11px] sm:text-xs font-bold text-foreground leading-tight">Community Member</p>
                            <p className="text-[9.5px] sm:text-[10.5px] text-muted-foreground">
                              Resident / Owner
                            </p>
                          </div>
                        </label>

                        <label className="relative flex items-center p-2 sm:p-3 border border-border/50 bg-muted/15 rounded-lg sm:rounded-xl cursor-not-allowed opacity-50 transition-all select-none">
                          <input
                            type="radio"
                            value="vendor"
                            disabled
                            {...register("userType")}
                            className="w-3.5 h-3.5 accent-primary cursor-not-allowed"
                          />
                          <div className="ml-2 sm:ml-3">
                            <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground leading-tight">
                              Vendor / Service
                            </p>
                            <p className="text-[9.5px] sm:text-[10px] text-muted-foreground/70">
                              Service partners
                            </p>
                          </div>
                          <span className="ml-auto text-[8.5px] sm:text-[9px] font-bold tracking-wider px-1 py-0.2 rounded bg-muted text-muted-foreground uppercase border border-border/50">
                            Soon
                          </span>
                        </label>
                      </div>
                    </div>

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

                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={advance}
                      className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 xl:py-3.5 px-4 sm:px-6 bg-gradient-to-r from-primary via-primary to-indigo-600 hover:opacity-95 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
            /* ── STEP 5: Success Celebration Screen ────────── */
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

              <div className="grid grid-cols-1 gap-1.5 sm:gap-2 w-full max-w-sm mb-4 sm:mb-6 text-left">
                {[
                  { icon: Mail, text: "Confirmation email sent" },
                  { icon: ShieldCheck, text: "Identity verification in progress" },
                ].map(({ icon: Icon, text }, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-card rounded-lg sm:rounded-xl border border-border shadow-xs"
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-primary" />
                    <span className="text-[11px] sm:text-xs font-medium text-foreground">{text}</span>
                  </div>
                ))}
              </div>

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
