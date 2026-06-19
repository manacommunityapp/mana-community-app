import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  Home,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { communityService } from "../../services/communityService";
import type { CommunityResponse } from "../../types/api";
import { PasswordStrengthMeter } from "./commons/PasswordStrengthMeter";
import { evaluatePassword, generateStrongPassword } from "../../utils/passwordStrength";

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

export function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: {
      communityType: "apartment",
      userType: "member",
      gender: "MALE",
    },
  });

  const password = watch("password");
  const email = watch("email");
  const fullName = watch("fullName");
  const phone = watch("phone");
  const communityType = watch("communityType");
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);

  const handleSuggestPassword = () => {
    const suggested = generateStrongPassword(16);
    setValue("password", suggested, { shouldValidate: true });
    setValue("confirmPassword", suggested, { shouldValidate: true });
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const data = await communityService.getCommunities(communityType);
        setCommunities(data);
      } catch (err) {
        console.error("Failed to fetch communities", err);
      }
    };
    fetchCommunities();
  }, [communityType]);

  const onSubmit = async (data: SignupFormValues) => {
    try {
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
      navigate("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
    }
  };

  const communityTypes = [
    { value: "apartment", label: "Apartment Complex", icon: Building2 },
    { value: "college", label: "College/University", icon: GraduationCap },
    { value: "local", label: "Local Community", icon: Home },
  ];

  // Shared input classes for the dark theme
  const inputCls = "w-full px-4 py-3 bg-[var(--mana-bg-input)] border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all";
  const labelCls = "block text-sm font-medium text-muted-foreground mb-2";

  return (
    <div className="min-h-screen bg-background py-12 px-4 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <Toaster position="top-center" richColors />
      <div className="w-full max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-primary p-3 rounded-2xl mb-4 shadow-lg shadow-primary/20">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Join Mana Community</h1>
          <p className="text-muted-foreground">Create your account and connect with your community</p>
        </div>

        <div className="bg-card rounded-2xl shadow-2xl border border-border p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Community Selection */}
            <div>
              <label className={labelCls}>
                Select Your Community Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {communityTypes.map((type) => (
                  <label
                    key={type.value}
                    className="relative flex flex-col items-center p-4 border-2 border-border rounded-xl cursor-pointer hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/10 transition-all"
                  >
                    <input
                      type="radio"
                      value={type.value}
                      {...register("communityType")}
                      className="sr-only"
                    />
                    <type.icon className="w-8 h-8 text-[#94a3b8] mb-2" />
                    <span className="text-xs font-medium text-[#94a3b8] text-center">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="fullName" className={labelCls}>
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  {...register("fullName", { required: "Full name is required" })}
                  className={inputCls}
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="text-[#ef4444] text-xs mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="signup-email" className={labelCls}>
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" },
                  })}
                  className={inputCls}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-[#ef4444] text-xs mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="phone" className={labelCls}>
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register("phone", { required: "Phone number is required" })}
                  className={inputCls}
                  placeholder="+91 98765 43210"
                />
                {errors.phone && (
                  <p className="text-[#ef4444] text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="dateOfBirth" className={labelCls}>
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth", { required: "Date of birth is required" })}
                  className={`${inputCls} [color-scheme:dark]`}
                />
                {errors.dateOfBirth && (
                  <p className="text-[#ef4444] text-xs mt-1">{errors.dateOfBirth.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>
                  Select Community
                </label>
                <select
                  onChange={(e) => setValue("communityCode", e.target.value, { shouldValidate: true })}
                  className={`${inputCls} mb-4`}
                >
                  <option value="">Select your community...</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.inviteCode}>
                      {c.name} {c.city ? `(${c.city})` : ""}
                    </option>
                  ))}
                </select>

                <label htmlFor="communityCode" className={labelCls}>
                  Community Invite Code
                </label>
                <input
                  id="communityCode"
                  type="text"
                  {...register("communityCode", { required: "Community code is required" })}
                  className={inputCls}
                  placeholder="e.g., APT-TOWER-A-2024"
                />
                {errors.communityCode && (
                  <p className="text-[#ef4444] text-xs mt-1">{errors.communityCode.message}</p>
                )}
                <p className="text-xs text-[#64748b] mt-1">
                  Select from above or enter manually
                </p>
              </div>

              <div>
                <label className={labelCls}>Gender</label>
                <select
                  {...register("gender")}
                  className={inputCls}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            
            {communityType === "apartment" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-1">
                <div>
                  <label htmlFor="block" className={labelCls}>
                    Block / Wing
                  </label>
                  <input
                    id="block"
                    type="text"
                    {...register("block", { required: communityType === "apartment" ? "Block is required" : false })}
                    className={inputCls}
                    placeholder="e.g., A, B, Phase 1"
                  />
                  {errors.block && (
                    <p className="text-[#ef4444] text-xs mt-1">{errors.block.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="flatNo" className={labelCls}>
                    Flat Number
                  </label>
                  <input
                    id="flatNo"
                    type="text"
                    {...register("flatNo", { required: communityType === "apartment" ? "Flat number is required" : false })}
                    className={inputCls}
                    placeholder="e.g., 101, 202-B"
                  />
                  {errors.flatNo && (
                    <p className="text-[#ef4444] text-xs mt-1">{errors.flatNo.message}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative flex items-center p-3 border-2 border-border rounded-lg cursor-pointer hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/10 transition-all">
                  <input
                    type="radio"
                    value="member"
                    {...register("userType")}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="ml-3 text-sm font-medium text-muted-foreground">Community Member</span>
                </label>
                <label className="relative flex items-center p-3 border-2 border-border rounded-lg cursor-pointer hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/10 transition-all">
                  <input
                    type="radio"
                    value="vendor"
                    {...register("userType")}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="ml-3 text-sm font-medium text-muted-foreground">Vendor/Service Provider</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="signup-password" className={labelCls}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleSuggestPassword}
                    className="text-xs font-medium text-primary hover:underline mb-1"
                  >
                    Suggest strong password
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                      validate: (value) =>
                        evaluatePassword(value, [email, fullName, phone]).acceptable ||
                        "Password is too easy to guess — make it stronger.",
                    })}
                    className={`${inputCls} pr-11`}
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={password || ""} userInputs={[email, fullName, phone]} />
                {errors.password && (
                  <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelCls}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) => value === password || "Passwords do not match",
                    })}
                    className={`${inputCls} pr-11`}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("terms", { required: "You must agree to the terms" })}
                  className="mt-1 w-4 h-4 accent-primary bg-[var(--mana-bg-input)] border-border rounded focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground leading-tight">
                  I agree to the Terms of Service and Privacy Policy, and consent to identity
                  verification for community safety
                </span>
              </label>
              {errors.terms && (
                <p className="text-destructive text-xs mt-1 ml-7">{errors.terms.message}</p>
              )}
            </div>

            <button
              type="submit"
              id="signup-submit-btn"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-3 px-4 bg-primary hover:bg-primary/90 active:scale-[0.97] text-white font-semibold rounded-lg shadow-lg shadow-primary/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Continue to Verification
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
