import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  ShieldCheck,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { authService } from "../../../../services/common/authService";
import { otpService } from "../../../../services/common/otpService";
import { PasswordStrengthMeter } from "../PasswordStrengthMeter";
import { evaluatePassword, generateStrongPassword } from "../../../../utils/passwordStrength";

type Step = 1 | 2 | 3;

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Form states
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI / Async states
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // OTP Input refs for autofocus
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Validate Email
  const isValidEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      toast.error("Please enter your registered email address.");
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSendingOtp(true);
    try {
      // Try dedicated forgot-password endpoint first; fallback to generic OTP service if needed
      try {
        const res = await authService.sendPasswordResetOtp(cleanEmail);
        toast.success(res?.message || "Verification code sent to your email!");
      } catch (err: any) {
        // If backend forgot-password endpoint returns an explicit message, display it
        const message = err instanceof Error ? err.message : "Failed to send code";
        // If message is specifically user not found, don''t fallback
        if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("inactive") || message.toLowerCase().includes("deactivated")) {
          throw err;
        }
        // Fallback to otpService
        const otpResp = await otpService.send(cleanEmail);
        if (!otpResp.success) {
          throw new Error(otpResp.message || "Failed to send OTP");
        }
        toast.success("Verification code sent to your email!");
      }

      setStep(2);
      setResendCooldown(60);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Unable to send verification code. Please try again.";
      toast.error(message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    // Handle pasted multi-digit code
    if (value.length > 1) {
      const sanitized = value.replace(/\D/g, "").slice(0, 6);
      if (sanitized.length > 0) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = sanitized[i] || "";
        }
        setOtpDigits(nextDigits);
        const nextFocusIndex = Math.min(sanitized.length, 5);
        inputRefs.current[nextFocusIndex]?.focus();
        return;
      }
    }

    const cleanChar = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = cleanChar;
    setOtpDigits(nextDigits);

    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace in OTP inputs
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Generate strong random password
  const handleGeneratePassword = () => {
    const pwd = generateStrongPassword(8);
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    toast.info("Generated a strong 8-character password!");
  };

  // Step 2: Reset Password submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const fullOtp = otpDigits.join("").trim();

    if (fullOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    const pwdEval = evaluatePassword(newPassword, [cleanEmail]);
    if (!pwdEval.acceptable) {
      toast.error(pwdEval.warning || pwdEval.suggestions[0] || "Password does not meet requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await authService.resetPassword({
        email: cleanEmail,
        otpCode: fullOtp,
        newPassword,
      });

      toast.success(res?.message || "Password updated successfully!");
      setStep(3);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Password reset failed. Please check the code and try again.";
      toast.error(message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Masked email for UI display
  const maskedEmail = () => {
    const clean = email.trim();
    const at = clean.indexOf("@");
    if (at <= 2) return clean;
    return clean.slice(0, 2) + "***" + clean.slice(at);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <Toaster position="top-center" richColors />

      <div className="w-full max-w-md relative z-10">
        {/* Top Header & Branding */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center bg-primary p-3 rounded-2xl mb-4 shadow-lg shadow-primary/20">
            <KeyRound className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            {step === 1 && "Forgot Password"}
            {step === 2 && "Verify & Set Password"}
            {step === 3 && "Password Reset Complete"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {step === 1 && "Enter your registered email to receive a verification code"}
            {step === 2 && "Enter the 6-digit code sent to your email"}
            {step === 3 && "Your account password has been safely updated"}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-card rounded-2xl shadow-2xl border border-border p-6 sm:p-8">
          {/* ──────── STEP 1: Enter Email ──────── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-muted-foreground mb-2">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-[var(--mana-bg-input)] border border-border rounded-lg placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-sm"
                    disabled={isSendingOtp}
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                  We will send a 6-digit OTP verification code to verify your identity.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp || !email.trim()}
                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border-none text-sm"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code…</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center border-t border-border">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Remember your password? Sign in</span>
                </Link>
              </div>
            </form>
          )}

          {/* ──────── STEP 2: Verify OTP & New Password ──────── */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Target email badge with change option */}
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Code sent to</p>
                    <p className="text-xs font-semibold text-foreground truncate">{maskedEmail()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-primary hover:underline font-medium shrink-0 cursor-pointer bg-transparent border-none p-1"
                >
                  Change
                </button>
              </div>

              {/* 6-Digit OTP Inputs */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasteData = e.clipboardData.getData("text");
                        handleOtpChange(idx, pasteData);
                      }}
                      className="w-11 h-12 sm:w-12 sm:h-12 text-center text-lg font-bold bg-[var(--mana-bg-input)] border border-border rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                      disabled={isResettingPassword}
                    />
                  ))}
                </div>

                {/* Resend OTP button & timer */}
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-xs text-muted-foreground">
                    Didn't receive the email?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={resendCooldown > 0 || isSendingOtp}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-transparent border-none"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSendingOtp ? "animate-spin" : ""}`} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="new-password" className="block text-sm font-medium text-muted-foreground">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer bg-transparent border-none"
                    title="Generate a secure 8-character password"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Auto-generate</span>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="4 to 8 characters (letters & digits)"
                    maxLength={8}
                    className="w-full pl-10 pr-10 py-2.5 bg-[var(--mana-bg-input)] border border-border rounded-lg placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-sm"
                    disabled={isResettingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground cursor-pointer bg-transparent border-none p-0"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <PasswordStrengthMeter password={newPassword} userInputs={[email]} className="mt-1" />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    maxLength={8}
                    className="w-full pl-10 pr-10 py-2.5 bg-[var(--mana-bg-input)] border border-border rounded-lg placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-sm"
                    disabled={isResettingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground cursor-pointer bg-transparent border-none p-0"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-destructive text-xs mt-1">Passwords do not match.</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-1 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Passwords match</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isResettingPassword ||
                  otpDigits.join("").length !== 6 ||
                  !newPassword ||
                  newPassword !== confirmPassword ||
                  !evaluatePassword(newPassword).acceptable
                }
                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border-none text-sm"
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password…</span>
                  </>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to email entry</span>
                </button>
              </div>
            </form>
          )}

          {/* ──────── STEP 3: Reset Success ──────── */}
          {step === 3 && (
            <div className="text-center py-4 space-y-5 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/60 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">Password Reset Successful!</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Your account password has been updated. You can now use your new password to sign in to Mana Community.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer border-none text-sm"
              >
                <span>Sign In with New Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ForgotPassword;
