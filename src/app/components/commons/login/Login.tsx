import { useState } from "react";
import { useForm } from "react-hook-form";
import { ShieldCheck, Eye, EyeOff, ArrowRight, Loader2, WifiOff, RefreshCw, ServerCrash } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../../../contexts/AuthContext";

type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    return msg.includes("failed to fetch") || msg.includes("network") || msg.includes("load failed");
  }
  return false;
}

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [serviceError, setServiceError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    setServiceError(false);
    try {
      await login({ email: data.email, password: data.password });
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      if (isNetworkError(err)) {
        setServiceError(true);
      } else {
        const message = err instanceof Error ? err.message : "Login failed";
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle radial glow behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <Toaster position="top-center" richColors />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-primary p-3 rounded-2xl mb-4 shadow-lg shadow-primary/20">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Mana Community</p>
        </div>

        <div className="bg-card rounded-2xl shadow-2xl border border-border p-8">
          {serviceError && (
            <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2.5 bg-red-100 dark:bg-red-900/40 rounded-xl">
                  <ServerCrash className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-red-800 dark:text-red-300 mb-1">
                    Service Unavailable
                  </h3>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed mb-3">
                    We're unable to connect to the server right now. This could be due to maintenance or a temporary outage. Please try again in a moment.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={retrying}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-60 cursor-pointer border-none shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
                      {retrying ? "Checking…" : "Retry Connection"}
                    </button>
                    <div className="flex items-center gap-1.5 text-[10px] text-red-500/70 dark:text-red-400/50">
                      <WifiOff className="w-3 h-3" />
                      <span>Connection failed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" },
                })}
                className="w-full px-4 py-3 bg-[var(--mana-bg-input)] border border-border rounded-lg placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password", { required: "Password is required" })}
                  className="w-full px-4 py-3 bg-[var(--mana-bg-input)] border border-border rounded-lg placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all pr-11"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="w-4 h-4 accent-primary bg-[var(--mana-bg-input)] border-border rounded focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-3 px-4 bg-primary hover:bg-primary/90 active:scale-[0.97] text-white font-semibold rounded-lg shadow-lg shadow-primary/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:text-primary/80 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground/60">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
