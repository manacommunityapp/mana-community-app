import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import {
  UserCircle,
  ShieldCheck,
  Edit3,
  Camera,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Building2,
  Star,
  Trophy,
  Package,
  Briefcase,
  Users,
  Bell,
  Lock,
  Key,
  Monitor,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Globe,
  Link2,
  Save,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Smartphone,
  Shield,
  Award,
  PenLine,
  RefreshCw,
  Layers,
  Home,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { profileService } from "../../../services/common/profileService";
import { authService } from "../../../services/common/authService";
import { fileUploadService } from "../../../services/files/fileUploadService";
import { useAuth } from "../../../contexts/AuthContext";
import { evaluatePassword, generateStrongPassword } from "../../../utils/passwordStrength";
import { PasswordStrengthMeter } from "../commons/PasswordStrengthMeter";
import type { UserProfileResponse } from "../../../types/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = "overview" | "activity" | "achievements" | "settings" | "security";

const defaultAvatar =
  "https://images.unsplash.com/photo-1707396172424-f3293f788364?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwcm9maWxlJTIwYXZhdGFyJTIwcGVyc29ufGVufDF8fHx8MTc3NzA1ODgxOXww&ixlib=rb-4.1.0&q=80&w=1080";
const defaultCover = "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200&q=80";

const activityFeed = [
  {
    id: 1,
    type: "post",
    text: "Posted in Community Feed: 'Reminder: Society AGM this Sunday at 5PM'",
    time: "2 hours ago",
    icon: Users,
    color: "indigo",
  },
  {
    id: 2,
    type: "marketplace",
    text: "Listed '4-seater dining table' on Marketplace for ₹8,500",
    time: "1 day ago",
    icon: Package,
    color: "emerald",
  },
  {
    id: 3,
    type: "event",
    text: "Registered for 'Annual Sports Day 2026'",
    time: "2 days ago",
    icon: Trophy,
    color: "yellow",
  },
  {
    id: 4,
    type: "job",
    text: "Referred a candidate for 'Senior React Developer' at TechCorp",
    time: "3 days ago",
    icon: Briefcase,
    color: "purple",
  },
  {
    id: 5,
    type: "sports",
    text: "Scored 42 runs in Cricket Tournament – Tower A vs Tower B",
    time: "5 days ago",
    icon: Trophy,
    color: "orange",
  },
  {
    id: 6,
    type: "post",
    text: "Posted in Community Feed: 'Lost & Found: Black umbrella near pool area'",
    time: "1 week ago",
    icon: Users,
    color: "indigo",
  },
];

const sessions = [
  { id: 1, device: "Chrome on MacOS", location: "Bangalore, IN", lastActive: "Active now", isCurrent: true },
  { id: 2, device: "Mobile App - iOS", location: "Bangalore, IN", lastActive: "2 hours ago", isCurrent: false },
  { id: 3, device: "Firefox on Windows", location: "Hyderabad, IN", lastActive: "3 days ago", isCurrent: false },
];

export function ProfileDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { updateUser } = useAuth();
  const activeTab = (searchParams.get("tab") as Tab) || "overview";

  const setActiveTab = (tab: Tab) => {
    setSearchParams(
      (prev) => {
        prev.set("tab", tab);
        return prev;
      },
      { replace: true }
    );
  };

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "MALE",
    block: "",
    flatNo: "",
    bio: "",
  });

  const [newSkill, setNewSkill] = useState("");
  const [showAddSkillInput, setShowAddSkillInput] = useState(false);

  const [notifications, setNotifications] = useState({
    communityPosts: true,
    marketplaceUpdates: true,
    jobAlerts: false,
    eventReminders: true,
    sportsUpdates: true,
    adminAlerts: true,
    emailDigest: false,
    pushNotifications: true,
  });

  const loadProfile = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await profileService.getProfile();
      setProfile(res);
      setFormData({
        fullName: res.fullName || "",
        email: res.email || "",
        phone: res.phone || "",
        dob: res.dob || "",
        gender: res.gender || "MALE",
        block: res.block || "",
        flatNo: res.flatNo || "",
        bio: res.bio || "",
      });

      // Synchronize into AuthContext
      updateUser({
        fullName: res.fullName,
        email: res.email,
        phone: res.phone,
        gender: res.gender,
        dateOfBirth: res.dob,
        flatNo: res.flatNo,
        block: res.block,
      });

      if (isSilent) toast.success("Profile refreshed from database!");
    } catch (err) {
      console.error("Error loading user profile from database:", err);
      toast.error("Failed to load profile data from database.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const getRoleConfig = (roleStr?: string) => {
    const r = (roleStr || "MEMBER").toUpperCase();
    if (r.includes("ADMIN")) {
      return { label: "Admin", color: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60", icon: Award };
    } else if (r === "VENDOR") {
      return { label: "Vendor", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60", icon: ShieldCheck };
    }
    return { label: "Verified Member", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60", icon: ShieldCheck };
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const res = await profileService.updateProfile({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        dob: formData.dob,
        gender: formData.gender,
        block: formData.block.trim().toUpperCase(),
        flatNo: formData.flatNo.trim(),
        bio: formData.bio.trim(),
        skills: profile.skills,
        profilePicUrl: profile.profilePicUrl,
        coverPicUrl: profile.coverPicUrl,
      });

      setProfile(res);
      setIsEditing(false);

      // Synchronize updated details across AuthContext
      updateUser({
        fullName: res.fullName,
        email: res.email,
        phone: res.phone,
        gender: res.gender,
        dateOfBirth: res.dob,
        flatNo: res.flatNo,
        block: res.block,
        profilePicUrl: res.profilePicUrl,
      });

      toast.success("Profile saved and synchronized successfully!");
    } catch (err) {
      console.error("Error updating profile in database:", err);
      toast.error("Failed to update profile in database.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);

    try {
      let finalUrl = "";
      try {
        const uploadRes = await fileUploadService.upload(file, "USER", String(profile.userId));
        finalUrl = uploadRes.url;
      } catch {
        // Fallback: convert file to local Base64 data-URI if cloud upload is not configured
        finalUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const res = await profileService.updateProfile({
        ...formData,
        skills: profile.skills,
        profilePicUrl: finalUrl,
      });

      setProfile(res);
      updateUser({
        fullName: res.fullName,
        profilePicUrl: res.profilePicUrl || finalUrl,
      });
      toast.success("Profile picture updated!");
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      toast.error("Failed to update profile picture.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddSkill = async () => {
    if (!profile || !newSkill.trim()) return;
    const updatedSkills = [...profile.skills, newSkill.trim()];

    try {
      const res = await profileService.updateProfile({
        skills: updatedSkills,
      });
      setProfile(res);
      setNewSkill("");
      setShowAddSkillInput(false);
      toast.success("Skill added!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add skill.");
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!profile) return;
    const updatedSkills = profile.skills.filter((s) => s !== skillToRemove);

    try {
      const res = await profileService.updateProfile({
        skills: updatedSkills,
      });
      setProfile(res);
      toast.success("Skill removed!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove skill.");
    }
  };

  // ── Change Password State ──
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const handleSuggestNewPassword = () => {
    const suggested = generateStrongPassword(10);
    setPasswordForm((prev) => ({
      ...prev,
      newPassword: suggested,
      confirmPassword: suggested,
    }));
    setShowNewPassword(true);
    setShowConfirmPassword(true);
    setPasswordErrors((prev) => ({ ...prev, newPassword: undefined, confirmPassword: undefined }));
    toast.info("Generated a secure 10-character password!");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof passwordErrors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else {
      const userInputs = [profile?.email, profile?.fullName, profile?.phone].filter(Boolean) as string[];
      const evalResult = evaluatePassword(passwordForm.newPassword, userInputs);
      if (!evalResult.acceptable) {
        errors.newPassword = evalResult.warning || "Password must be 6–20 characters with letters & numbers";
      }
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "New password and confirm password do not match";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    setIsChangingPassword(true);
    try {
      const res = await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      toast.success(res.message || "Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err: any) {
      console.error("Change password error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update password. Please verify current password.";
      toast.error(msg);
      if (
        msg.toLowerCase().includes("current") ||
        msg.toLowerCase().includes("incorrect") ||
        msg.toLowerCase().includes("old")
      ) {
        setPasswordErrors((prev) => ({ ...prev, currentPassword: msg }));
      } else {
        setPasswordErrors((prev) => ({ ...prev, newPassword: msg }));
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Fetching profile details from database...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground gap-3">
        <AlertTriangle className="w-8 h-8 text-destructive" />
        <p className="font-semibold text-foreground">Could not load user profile.</p>
        <button
          onClick={() => loadProfile()}
          className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const role = getRoleConfig(profile.role);
  const userAvatar = profile.profilePicUrl || defaultAvatar;
  const unitDisplay = profile.block || profile.flatNo
    ? `${profile.block ? `Block ${profile.block}` : ""}${profile.block && profile.flatNo ? " - " : ""}${profile.flatNo ? `Flat ${profile.flatNo}` : ""}`
    : "No Unit Assigned";

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "activity", label: "Activity" },
    { id: "achievements", label: "Achievements" },
    { id: "settings", label: "Settings" },
    { id: "security", label: "Security" },
  ];

  const achievements = profile.achievements ?? [];

  return (
    <div className="space-y-0 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      <Toaster position="top-center" richColors />

      {/* Profile Header */}
      <div className="bg-card border-b border-border px-6 sm:px-10 pt-20 pb-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-20 pb-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-[2rem] overflow-hidden border-4 border-card shadow-2xl ring-4 ring-primary/20 bg-muted">
                <img src={userAvatar} alt={profile.fullName} className="w-full h-full object-cover" />
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute top-3 right-3 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow" />
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 text-white p-2.5 rounded-xl shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
                title="Change profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Name & Meta */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{profile.fullName}</h1>
                <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest", role.color)}>
                  <role.icon className="w-3.5 h-3.5" /> {role.label}
                </span>
                {profile.kycStatus === "VERIFIED" && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" /> KYC Verified
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-4 h-4 text-primary" />
                  {profile.communityName || "Community Member"}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Home className="w-4 h-4 text-indigo-500" />
                  {unitDisplay}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  Member since {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Active"}
                </span>
                <span className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-lg font-mono">
                  ID: #{profile.userId}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pb-2">
              <button
                type="button"
                onClick={() => loadProfile(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition-all text-xs border border-border cursor-pointer disabled:opacity-60"
                title="Refresh user data from database"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-primary")} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeTab !== "settings") {
                    setActiveTab("settings");
                  }
                  setIsEditing(!isEditing);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-md shadow-primary/25 text-xs sm:text-sm cursor-pointer"
              >
                <PenLine className="w-4 h-4" />
                {isEditing ? "Cancel Edit" : "Edit Profile"}
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-6">
            {[
              { label: "Posts", value: profile.stats.posts, colorClass: "text-indigo-600 dark:text-indigo-400", bgClass: "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30" },
              { label: "Network", value: profile.stats.connections, colorClass: "text-violet-600 dark:text-violet-400", bgClass: "bg-violet-50/50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/30" },
              { label: "Events", value: profile.stats.eventsAttended, colorClass: "text-rose-600 dark:text-rose-400", bgClass: "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30" },
              { label: "Items", value: profile.stats.itemsSold, colorClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30" },
              { label: "Jobs", value: profile.stats.jobsPosted, colorClass: "text-blue-600 dark:text-blue-400", bgClass: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30" },
              { label: "Sports", value: profile.stats.sportsPlayed, colorClass: "text-amber-600 dark:text-amber-400", bgClass: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30" },
            ].map((stat) => (
              <div key={stat.label} className={cn("rounded-2xl p-3.5 text-center border", stat.bgClass)}>
                <div className={cn("text-xl sm:text-2xl font-black", stat.colorClass)}>{stat.value}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-0 -mb-px mt-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-5xl mx-auto">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* About & Contact Cards */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h2 className="font-bold text-foreground text-base mb-3">About Resident</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                    {profile.bio || "No personal bio added yet."}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/60">
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</p>
                        <p className="font-semibold text-foreground truncate">{profile.email || "Not Provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/60">
                      <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone</p>
                        <p className="font-semibold text-foreground">{profile.phone || "Not Provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/60">
                      <Home className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Residence Unit</p>
                        <p className="font-semibold text-foreground">{unitDisplay}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/60">
                      <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</p>
                        <p className="font-semibold text-foreground">
                          {profile.dob
                            ? new Date(profile.dob).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Not Provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills & Interests */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h2 className="font-bold text-foreground text-base mb-3">Skills & Community Interests</h2>
                  <div className="flex flex-wrap gap-2 items-center">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-destructive font-bold ml-1 text-xs cursor-pointer"
                          title="Remove skill"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {showAddSkillInput ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newSkill}
                          placeholder="Skill / Hobby"
                          onChange={(e) => setNewSkill(e.target.value)}
                          className="px-3 py-1 text-xs border border-border rounded-lg outline-none bg-[var(--mana-bg-input)] w-32 focus:ring-2 focus:ring-primary/30"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddSkill();
                            if (e.key === "Escape") setShowAddSkillInput(false);
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="text-xs px-2.5 py-1 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddSkillInput(false)}
                          className="text-xs px-2.5 py-1 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddSkillInput(true)}
                        className="px-3 py-1 bg-muted/40 text-muted-foreground text-xs font-semibold rounded-full border border-dashed border-border hover:bg-muted/80 transition-colors cursor-pointer"
                      >
                        + Add Skill
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* KYC Status Card */}
                <div
                  className={cn(
                    "rounded-2xl border p-5 shadow-sm",
                    profile.kycStatus === "VERIFIED"
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                      : profile.kycStatus === "PENDING"
                      ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60"
                      : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck
                      className={cn(
                        "w-5 h-5",
                        profile.kycStatus === "VERIFIED"
                          ? "text-emerald-600"
                          : profile.kycStatus === "PENDING"
                          ? "text-amber-600"
                          : "text-rose-600"
                      )}
                    />
                    <h3 className="font-bold text-foreground text-sm">Identity & KYC Status</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    {profile.kycStatus === "VERIFIED"
                      ? "Your identity and community residence have been verified by the community administrator."
                      : profile.kycStatus === "PENDING"
                      ? "Your verification is currently under review by the community admin."
                      : "Verification incomplete. Please upload identification documents."}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      profile.kycStatus === "VERIFIED"
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300"
                        : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                    )}
                  >
                    Status: {profile.kycStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Info Edit */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="font-bold text-foreground text-base">Personal Information</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Manage your user profile details stored in database
                      </p>
                    </div>

                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={handleSaveProfile}
                          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-white hover:bg-primary/90 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-60"
                        >
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wide">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground py-2 px-3 bg-muted/40 rounded-xl border border-border/50">
                          {formData.fullName || "Not provided"}
                        </p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wide">
                        Email Address
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground py-2 px-3 bg-muted/40 rounded-xl border border-border/50">
                          {formData.email || "Not provided"}
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wide">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          maxLength={10}
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                          className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground py-2 px-3 bg-muted/40 rounded-xl border border-border/50">
                          {formData.phone || "Not provided"}
                        </p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wide">
                        Date of Birth
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground py-2 px-3 bg-muted/40 rounded-xl border border-border/50">
                          {formData.dob
                            ? new Date(formData.dob).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "Not provided"}
                        </p>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wide">
                        Gender
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other / Prefer not to say</option>
                        </select>
                      ) : (
                        <p className="text-sm font-medium text-foreground py-2 px-3 bg-muted/40 rounded-xl border border-border/50">
                          {formData.gender}
                        </p>
                      )}
                    </div>

                    {/* Block & Flat Number */}
                    <div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wide">
                            Block / Wing
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              maxLength={10}
                              value={formData.block}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  block: e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase(),
                                })
                              }
                              placeholder="e.g. A"
                              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm uppercase font-bold text-center bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none"
                            />
                          ) : (
                            <p className="text-sm font-bold text-foreground py-2 px-3 bg-muted/40 rounded-xl border border-border/50 text-center">
                              {formData.block ? `Block ${formData.block}` : "—"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wide">
                            Flat No
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              value={formData.flatNo}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  flatNo: e.target.value.replace(/\D/g, "").slice(0, 4),
                                })
                              }
                              placeholder="e.g. 101"
                              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm font-semibold bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none"
                            />
                          ) : (
                            <p className="text-sm font-bold text-foreground py-2 px-3 bg-muted/40 rounded-xl border border-border/50 text-center">
                              {formData.flatNo ? `Flat ${formData.flatNo}` : "—"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wide">
                        Personal Bio
                      </label>
                      {isEditing ? (
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={3}
                          maxLength={250}
                          className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none resize-none"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground py-2.5 px-3 bg-muted/40 rounded-xl border border-border/50 leading-relaxed">
                          {formData.bio || "No bio yet."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-6">
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-foreground text-sm">Notification Preferences</h2>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(notifications).map(([key, value]) => {
                      const labels: Record<string, string> = {
                        communityPosts: "Community Posts",
                        marketplaceUpdates: "Marketplace",
                        jobAlerts: "Job Alerts",
                        eventReminders: "Event Reminders",
                        sportsUpdates: "Sports Updates",
                        adminAlerts: "Admin Alerts",
                        emailDigest: "Weekly Email Digest",
                        pushNotifications: "Push Notifications",
                      };
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">{labels[key]}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setNotifications((prev) => ({
                                ...prev,
                                [key]: !prev[key as keyof typeof prev],
                              }))
                            }
                            className={cn(
                              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer",
                              value ? "bg-primary" : "bg-muted"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow",
                                value ? "translate-x-4.5" : "translate-x-1"
                              )}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === "activity" && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-foreground text-base">Community Activity Feed</h2>
              <div className="space-y-3">
                {activityFeed.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-foreground leading-snug">{item.text}</p>
                      <p className="text-[10.5px] text-muted-foreground mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === "achievements" && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Award className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="font-bold text-foreground text-base">Achievements & Badges</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Earned across events, sports, and volunteer sevas</p>
                </div>
              </div>

              {achievements.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                    <Award className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No achievements yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Participate in sports leagues, community events, and volunteer work to earn badges.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {achievements.map((a) => (
                    <div
                      key={a.id}
                      className="text-center p-4 rounded-xl border-2 border-primary/20 bg-primary/5"
                    >
                      <div className="text-3xl mb-2 leading-none">{a.icon || "🏅"}</div>
                      <p className="text-sm font-bold text-foreground">{a.title}</p>
                      {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Change Password */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-foreground text-base">Change Password</h2>
                      <p className="text-xs text-muted-foreground">Keep your account secure with a strong password</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSuggestNewPassword}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1 px-2.5 rounded-lg hover:bg-primary/10 border border-primary/20 cursor-pointer shadow-2xs"
                    title="Generate a cryptographically-secure password"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Suggest Strong
                  </button>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {/* Current Password Field */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wide">
                      Current Password <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => {
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                          if (passwordErrors.currentPassword) {
                            setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined }));
                          }
                        }}
                        placeholder="Enter your current password"
                        maxLength={20}
                        className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm bg-[var(--mana-bg-input)] outline-none transition-all ${
                          passwordErrors.currentPassword
                            ? "border-destructive ring-2 ring-destructive/10"
                            : "border-border focus:ring-2 focus:ring-primary/25"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                        aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-destructive text-xs mt-1 font-medium">{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  {/* New Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wide">
                        New Password <span className="text-destructive">*</span>
                      </label>
                      <span className="text-[11px] text-muted-foreground">6–20 characters</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => {
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                          if (passwordErrors.newPassword) {
                            setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }));
                          }
                        }}
                        placeholder="6 to 20 characters (letters & numbers)"
                        maxLength={20}
                        className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm bg-[var(--mana-bg-input)] outline-none transition-all ${
                          passwordErrors.newPassword
                            ? "border-destructive ring-2 ring-destructive/10"
                            : "border-border focus:ring-2 focus:ring-primary/25"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrengthMeter
                      password={passwordForm.newPassword}
                      userInputs={[profile?.email, profile?.fullName, profile?.phone].filter(Boolean) as string[]}
                      className="mt-1.5"
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-destructive text-xs mt-1 font-medium">{passwordErrors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm New Password Field */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wide">
                      Confirm New Password <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => {
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                          if (passwordErrors.confirmPassword) {
                            setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                          }
                        }}
                        placeholder="Re-enter your new password"
                        maxLength={20}
                        className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm bg-[var(--mana-bg-input)] outline-none transition-all ${
                          passwordErrors.confirmPassword
                            ? "border-destructive ring-2 ring-destructive/10"
                            : "border-border focus:ring-2 focus:ring-primary/25"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-destructive text-xs mt-1 font-medium">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </form>
              </div>

              {/* Active Sessions */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Monitor className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="font-bold text-foreground text-base">Active Sessions</h2>
                    <p className="text-xs text-muted-foreground">Manage your logged-in devices</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border",
                        session.isCurrent
                          ? "bg-primary/5 border-primary/20"
                          : "bg-muted/30 border-border"
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground">{session.device}</p>
                          {session.isCurrent && (
                            <span className="text-[10px] bg-primary/15 text-primary font-bold px-2 py-0.2 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {session.location} · {session.lastActive}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
