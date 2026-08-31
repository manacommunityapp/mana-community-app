import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  WifiOff,
  RefreshCw,
  ServerCrash,
  CalendarDays,
  Mail,
  Lock,
  Sparkles,
  CalendarCheck,
  Bell,
  QrCode,
  Heart,
  Star,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../../../contexts/AuthContext";

type LoginFormValues = {
  identifier: string;
  password: string;
  rememberMe: boolean;
};

function validateIdentifier(value: string): true | string {
  const v = value.trim();
  if (!v) return "Email or mobile number is required";
  const isEmail = /^\S+@\S+\.\S+$/.test(v);
  const isMobile = /^\d{10}$/.test(v);
  if (!isEmail && !isMobile) {
    return "Enter a valid email address or 10-digit mobile number";
  }
  return true;
}

function isNetworkOrServerError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("unable to reach") ||
    msg.includes("unable to connect") ||
    msg.includes("unreachable") ||
    msg.includes("maintenance") ||
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("gateway") ||
    msg.includes("nginx") ||
    msg.includes("server error") ||
    msg.includes("server is still unavailable") ||
    msg.includes("connection failed")
  );
}

const HIGHLIGHTS = [
  { icon: CalendarCheck, title: "Event & Seva Bookings", desc: "Instant QR entry passes & slot selection" },
  { icon: Bell, title: "Society Notices & Alerts", desc: "Real-time updates directly from committee" },
  { icon: QrCode, title: "Digital Resident Pass", desc: "Seamless gate access for you & your guests" },
  { icon: Heart, title: "Community Bonding", desc: "Participate in local festivals & initiatives" },
];

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [serviceError, setServiceError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const eventContext = searchParams.get("event");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    setServiceError(false);
    try {
      const id = data.identifier.trim();
      const isMobile = /^\d{10}$/.test(id);
      const normalizedIdentifier = isMobile ? id : id.toLowerCase();
      await login({ identifier: normalizedIdentifier, password: data.password });
      toast.success("Welcome back!");
      navigate(redirectTo);
    } catch (err: any) {
      if (isNetworkOrServerError(err)) {
        setServiceError(true);
        toast.error("Unable to connect to server. Please try again shortly.");
      } else {
        const message = err instanceof Error ? err.message : "Invalid credentials. Please verify and try again.";
        toast.error(message);
      }
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await fetch("/api/auth/login", { method: "OPTIONS" }).catch(() => null);
      if (res && res.ok) {
        setServiceError(false);
        toast.success("Connection restored!");
      } else {
        toast.error("Service is still unavailable. Please try again later.");
      }
    } catch {
      toast.error("Service is still unavailable. Please try again later.");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-background text-foreground selection:bg-primary/20 overflow-hidden">
      <Toaster position="top-center" richColors />

      {/* ── Left Brand Showcase Panel (Desktop Browser) ────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden lg:w-[420px] xl:w-[480px] 2xl:w-[520px] shrink-0 text-white p-8 xl:p-10 select-none border-r border-white/10"
        style={{
          background: "linear-gradient(160deg, #4f46e5 0%, #4338ca 35%, #3730a3 70%, #1e1b4b 100%)",
        }}
      >
        {/* Ambient background glowing orbs */}
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
                Community Resident Portal
              </span>
            </div>
            <h4 className="text-white leading-[1.15] mb-2.5 text-2xl xl:text-3xl font-black tracking-tight">
              Welcome back to your
              <br />
              <span className="text-amber-300">Mana Community Hub</span>
            </h4>
            <p className="text-indigo-100/80 text-xs xl:text-sm leading-relaxed max-w-sm">
              Log in to manage bookings, stay updated with society notices, and connect with neighbors seamlessly.
            </p>
          </div>

          {/* Key Feature Highlights */}
          <div className="space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <div className="w-7 h-7 rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/15 mt-0.5 shadow-xs">
                  <Icon className="w-3.5 h-3.5 text-amber-200" />
                </div>
                <div>
                  <p className="text-white text-xs xl:text-[13px] font-bold leading-tight">{title}</p>
                  <p className="text-indigo-200/75 text-[11px] xl:text-xs leading-snug mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resident Testimonial / Social Proof */}
        <div className="relative z-10 pt-4 border-t border-white/10 space-y-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-3.5 xl:p-4 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex -space-x-2">
                {["#4f46e5", "#818cf8", "#10b981", "#ec4899"].map((c, i) => (
                  <div
                    key={i}
                    className="w-5.5 h-5.5 rounded-full border-2 border-white/60 flex items-center justify-center text-[8.5px] font-bold text-white shadow-xs"
                    style={{ background: c }}
                  >
                    {["R", "S", "M", "P"][i]}
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
              "Booking event passes and connecting with community members has never been easier."
            </p>
          </div>

          <div className="flex items-center justify-between text-indigo-200/70 text-[11px] px-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified & Secure Portal
            </span>
            <span>v2.4.0</span>
          </div>
        </div>
      </div>

      {/* ── Right Login Form Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none -z-0" />

        {/* ── Mobile Hero Banner ── shrink-0 so it never grows; tight padding ── */}
        <div
          className="lg:hidden relative overflow-hidden shrink-0 px-5 pt-5 pb-4 select-none"
          style={{ background: "linear-gradient(145deg, #4f46e5 0%, #4338ca 50%, #3730a3 100%)" }}
        >
          {/* Ambient glows */}
          <div
            className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-30 pointer-events-none blur-3xl"
            style={{ background: "radial-gradient(circle, #818cf8, transparent)" }}
          />
          <div
            className="absolute -bottom-8 -left-8 w-44 h-44 rounded-full opacity-20 pointer-events-none blur-3xl"
            style={{ background: "radial-gradient(circle, #c084fc, transparent)" }}
          />
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
          />

          <div className="relative z-10">
            {/* Brand row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/20 border border-white/25 backdrop-blur-sm shadow-lg">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-extrabold text-sm leading-none">Mana Community</p>
                  <p className="text-indigo-200 text-[10px] mt-0.5">Your neighborhood, connected</p>
                </div>
              </div>
              <Link
                to="/signup"
                className="text-[11px] font-bold text-white bg-white/15 hover:bg-white/25 border border-white/20 px-2.5 py-1 rounded-lg transition-colors backdrop-blur-sm"
              >
                Sign Up
              </Link>
            </div>

            {/* Headline */}
            <h4 className="text-white text-lg sm:text-xl font-black tracking-tight leading-snug mb-3">
              Welcome back to your
              <br />
              <span className="text-amber-300">Mana Community Hub</span>
            </h4>

            {/* Feature Pills — multi-row 2x2 grid layout */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {HIGHLIGHTS.map(({ icon: Icon, title }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-white/12 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl px-2.5 py-1.5 shadow-xs transition-all min-w-0"
                >
                  <Icon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="text-white text-[10px] sm:text-[11px] font-semibold truncate leading-tight">
                    {title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form area — flex-1 so it fills remaining height, centred vertically on desktop */}
        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          <div className="w-full max-w-[440px] mx-auto px-5 sm:px-8 py-4 sm:py-6 lg:my-auto relative z-10">
            {/* Desktop-only header */}
            <div className="text-left mb-5 hidden lg:block">
              <div className="inline-flex items-center justify-center bg-primary/10 text-primary p-2.5 rounded-xl mb-3 border border-primary/20 shadow-xs">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Sign In to Your Account
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your registered email or 10-digit mobile number
              </p>
            </div>

            {/* Event Context Notification */}
            {eventContext && (
              <div className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50 dark:border-indigo-800/50 dark:bg-indigo-950/30 p-3 flex items-start gap-2.5">
                <div className="flex-shrink-0 p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                  <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Event Registration</p>
                  <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
                    Sign in to continue with your event registration.
                  </p>
                </div>
              </div>
            )}

            {/* Server Error Alert */}
            {serviceError && (
              <div className="mb-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg">
                    <ServerCrash className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-red-800 dark:text-red-300 mb-0.5">Service Unavailable</h3>
                    <p className="text-[11px] text-red-600/80 dark:text-red-400/80 leading-relaxed mb-2">
                      We're unable to connect to the server right now.
                    </p>
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={retrying}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-60 cursor-pointer border-none shadow-xs"
                    >
                      <RefreshCw className={`w-3 h-3 ${retrying ? "animate-spin" : ""}`} />
                      {retrying ? "Checking…" : "Retry Connection"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Form Card */}
            <div className="bg-card rounded-2xl shadow-xl shadow-black/[0.04] border border-border p-4 sm:p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                {/* Identifier */}
                <div>
                  <label
                    htmlFor="identifier"
                    className="block text-[11px] font-bold text-foreground/80 mb-1.5 uppercase tracking-wide"
                  >
                    Email or Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="identifier"
                      type="text"
                      inputMode="email"
                      autoComplete="username"
                      {...register("identifier", { validate: validateIdentifier })}
                      className="w-full pl-10 pr-4 py-2.5 bg-[var(--mana-bg-input)] border border-border rounded-xl placeholder:text-muted-foreground/45 focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all text-xs sm:text-sm text-foreground"
                      placeholder="name@example.com or 9876543210"
                    />
                  </div>
                  {errors.identifier && (
                    <p className="text-destructive text-[11px] mt-1 font-medium">{errors.identifier.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-[11px] font-bold text-foreground/80 uppercase tracking-wide"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] text-primary hover:text-primary/80 font-bold transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      {...register("password", { required: "Password is required" })}
                      className="w-full pl-10 pr-10 py-2.5 bg-[var(--mana-bg-input)] border border-border rounded-xl placeholder:text-muted-foreground/45 focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all text-xs sm:text-sm text-foreground"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground p-0.5 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-[11px] mt-1 font-medium">{errors.password.message}</p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register("rememberMe")}
                      className="w-3.5 h-3.5 accent-primary bg-[var(--mana-bg-input)] border-border rounded focus:ring-primary cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground font-medium">Remember this device</span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center py-2.5 sm:py-3 px-4 bg-gradient-to-r from-primary via-primary to-indigo-600 hover:opacity-95 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md shadow-primary/25 hover:shadow-primary/35 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Signup */}
              <div className="mt-3.5 pt-3 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary hover:text-primary/80 font-bold transition-colors">
                    Create an account
                  </Link>
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-2.5 text-center">
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                Protected by 256-bit encryption • By signing in, you agree to our Terms
              </p>
            </div>
          </div>
        </div>

        {/* Footer — desktop only */}
        <div className="hidden lg:flex border-t border-border px-6 py-2.5 items-center justify-center gap-2 text-muted-foreground text-[10.5px] bg-background/50 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Official Mana Community Resident Network</span>
        </div>
      </div>
    </div>
  );
}
