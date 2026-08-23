import { useState, useRef, useEffect, useCallback, type ComponentType } from "react";
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
  Home,
  Loader2,
  Sparkles,
  Heart,
  Plus,
  Trash2,
  UserPlus,
  Smile,
  Droplet,
  Flame,
  UserCheck,
  Search,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { profileService } from "../../../services/common/profileService";
import { authService } from "../../../services/common/authService";
import { fileUploadService } from "../../../services/files/fileUploadService";
import { familyService, type FamilyMember } from "../../../services/common/familyService";
import { useAuth } from "../../../contexts/AuthContext";
import { evaluatePassword, generateStrongPassword } from "../../../utils/passwordStrength";
import { PasswordStrengthMeter } from "../commons/PasswordStrengthMeter";
import type { UserProfileResponse } from "../../../types/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = "overview" | "family" | "activity" | "achievements" | "settings" | "security";

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
  const { user, updateUser } = useAuth();
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
  const [imageError, setImageError] = useState(false);
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
      setImageError(false);
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
        profilePicUrl: res.profilePicUrl,
      });

      // Synchronize into Family Table as Self (Head)
      if (res.fullName) {
        familyService.syncUserProfile(res.fullName, res.dob, res.gender, res.phone, res.email);
      }

      if (isSilent) toast.success("Profile refreshed from database!");
    } catch (err) {
      console.error("Error loading user profile from database:", err);
      toast.error("Failed to load profile data from database.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateUser]);

  // ── Family Members State ──
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [familySearch, setFamilySearch] = useState("");
  const [familyFilterRelation, setFamilyFilterRelation] = useState<string>("ALL");
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [memberForm, setMemberForm] = useState<Partial<FamilyMember>>({
    name: "",
    relation: "Spouse",
    age: undefined,
    gender: "Female",
    phone: "",
    email: "",
    bloodGroup: "",
    gotram: "",
    emergencyContact: false,
    notes: "",
  });

  const loadFamilyMembers = useCallback(async () => {
    setLoadingFamily(true);
    try {
      const data = await familyService.getFamilyMembers();
      setFamilyMembers(data);
    } catch (err) {
      console.warn("Error loading family members:", err);
    } finally {
      setLoadingFamily(false);
    }
  }, []);

  useEffect(() => {
    loadFamilyMembers();
    window.addEventListener("mana_family_updated", loadFamilyMembers);
    return () => window.removeEventListener("mana_family_updated", loadFamilyMembers);
  }, [loadFamilyMembers]);

  const handleOpenAddFamily = () => {
    setEditingMember(null);
    setMemberForm({
      name: "",
      relation: "Spouse",
      age: undefined,
      gender: "Female",
      phone: "",
      email: "",
      bloodGroup: "",
      gotram: profile?.fullName ? "Bharadwaj" : "",
      emergencyContact: false,
      notes: "",
    });
    setIsFamilyModalOpen(true);
  };

  const handleOpenEditFamily = (member: FamilyMember) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      relation: member.relation,
      age: member.age,
      dob: member.dob,
      gender: member.gender || "Male",
      phone: member.phone || "",
      email: member.email || "",
      bloodGroup: member.bloodGroup || "",
      gotram: member.gotram || "",
      emergencyContact: member.emergencyContact || false,
      notes: member.notes || "",
    });
    setIsFamilyModalOpen(true);
  };

  const handleSaveFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name?.trim()) {
      toast.error("Please enter a name for the family member");
      return;
    }

    setIsSavingMember(true);
    try {
      if (editingMember) {
        await familyService.updateFamilyMember(editingMember.id, memberForm);
        toast.success(`Updated ${memberForm.name}'s details`);
      } else {
        await familyService.addFamilyMember(memberForm);
        toast.success(`Added ${memberForm.name} to your family list`);
      }
      setIsFamilyModalOpen(false);
      loadFamilyMembers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save family member");
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleDeleteFamilyMember = async (id: string | number, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from your family list?`)) {
      try {
        await familyService.deleteFamilyMember(id);
        toast.success(`Removed ${name} from family members`);
        loadFamilyMembers();
      } catch (err: any) {
        toast.error(err?.message || "Failed to delete family member");
      }
    }
  };

  const handleToggleEmergency = async (member: FamilyMember) => {
    try {
      const updated = !member.emergencyContact;
      await familyService.updateFamilyMember(member.id, { emergencyContact: updated });
      toast.success(updated ? `Marked ${member.name} as emergency contact` : `Removed ${member.name} from emergency contacts`);
      loadFamilyMembers();
    } catch (err: any) {
      toast.error("Failed to update emergency contact status");
    }
  };

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

      // Synchronize updated details across Family table
      if (res.fullName) {
        familyService.syncUserProfile(res.fullName, res.dob, res.gender, res.phone, res.email);
      }

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
  const userAvatar = profile.profilePicUrl || user?.profilePicUrl || "";
  const initials = (profile.fullName || user?.fullName || "User")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const unitDisplay = profile.block || profile.flatNo
    ? `${profile.block ? `Block ${profile.block}` : ""}${profile.block && profile.flatNo ? " - " : ""}${profile.flatNo ? `Flat ${profile.flatNo}` : ""}`
    : "No Unit Assigned";

  const tabs: { id: Tab; label: string; shortLabel: string; icon: ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", shortLabel: "Overview", icon: UserCircle },
    { id: "family", label: "My Family", shortLabel: "Family", icon: Heart },
    { id: "activity", label: "Activity", shortLabel: "Activity", icon: Bell },
    { id: "achievements", label: "Achievements", shortLabel: "Awards", icon: Trophy },
    { id: "settings", label: "Settings", shortLabel: "Settings", icon: Monitor },
    { id: "security", label: "Security", shortLabel: "Security", icon: Lock },
  ];

  const achievements = profile.achievements ?? [];

  return (
    <div className="space-y-0 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      <Toaster position="top-center" richColors />

      {/* Cover Banner — Hidden on mobile, shown on tablet/desktop */}
      <div className="hidden sm:block h-28 sm:h-40 md:h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 sm:w-64 h-44 sm:h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-6 top-3 w-28 sm:w-44 h-28 sm:h-44 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />
        <div className="absolute right-1/3 bottom-0 w-20 h-20 bg-pink-300/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Profile Header */}
      <div className="bg-card border-b border-border px-3.5 sm:px-6 lg:px-10 pb-0 pt-3 sm:pt-0">
        <div className="max-w-5xl mx-auto">

          {/* ── Header Row: Avatar + Name + Meta + Actions ── */}
          <div className="flex items-center sm:items-end gap-3 sm:gap-4 mt-0 sm:-mt-16 md:-mt-20 pb-3 sm:pb-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-36 sm:h-36 rounded-2xl sm:rounded-[2rem] overflow-hidden border-2 sm:border-4 border-card shadow-md sm:shadow-xl ring-2 sm:ring-4 ring-primary/20 bg-muted flex items-center justify-center relative">
                {userAvatar && !imageError ? (
                  <img
                    src={userAvatar}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-black select-none">
                    <span className="text-xl sm:text-4xl tracking-wider">
                      {initials}
                    </span>
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-1 z-10">
                    <Loader2 className="w-5 h-5 sm:w-7 sm:h-7 text-white animate-spin" />
                    <span className="text-[9px] text-white/90 font-bold hidden sm:inline">Uploading...</span>
                  </div>
                )}
              </div>
              <div className="absolute top-1 right-1 sm:top-3 sm:right-3 w-2.5 h-2.5 sm:w-4 sm:h-4 bg-emerald-400 rounded-full border-2 border-white shadow" />
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-primary hover:bg-primary/90 text-white p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50 z-20"
                title="Change profile picture"
              >
                <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Name + Role + Meta + Actions */}
            <div className="flex-1 min-w-0">
              {/* Name row with actions on same line */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-base sm:text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight truncate pr-1">
                    {profile.fullName}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1 whitespace-nowrap">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap shrink-0", role.color)}>
                      <role.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {role.label}
                    </span>
                    {profile.kycStatus === "VERIFIED" ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap shrink-0">
                        <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" /> KYC Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap shrink-0">
                        <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600" /> KYC {profile.kycStatus || "Pending"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => loadProfile(true)}
                    disabled={refreshing}
                    className="p-1.5 sm:hidden bg-muted hover:bg-muted/80 text-foreground rounded-xl border border-border cursor-pointer disabled:opacity-60 transition-all"
                    title="Refresh"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-primary")} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (activeTab !== "settings") setActiveTab("settings"); setIsEditing(!isEditing); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 sm:px-5 sm:py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-sm sm:shadow-md sm:shadow-primary/25 text-xs sm:text-sm cursor-pointer"
                  >
                    <PenLine className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{isEditing ? "Cancel" : "Edit"}</span>
                  </button>
                </div>
              </div>

              {/* Meta — single compact line */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10.5px] sm:text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5 font-medium">
                  <Building2 className="w-3 h-3 text-primary shrink-0" />
                  {profile.communityName || "Community"}
                </span>
                <span className="text-muted-foreground/30">•</span>
                <span className="flex items-center gap-0.5 font-medium">
                  <Home className="w-3 h-3 text-indigo-500 shrink-0" />
                  {unitDisplay}
                </span>
                <span className="hidden sm:flex items-center gap-0.5 text-muted-foreground/30">•</span>
                <span className="hidden sm:flex items-center gap-0.5 font-medium">
                  <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                  Since {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Active"}
                </span>
                <span className="hidden sm:flex text-[10px] bg-muted px-2 py-0.5 rounded-lg font-mono">ID: #{profile.userId}</span>
              </div>
            </div>
          </div>


          {/* Desktop refresh — hidden on mobile (replaced by icon button above) */}
          <div className="hidden sm:flex items-center gap-2 mb-2 -mt-1">
            <button
              type="button"
              onClick={() => loadProfile(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-xs border border-border cursor-pointer disabled:opacity-60 transition-all"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-primary")} />
              Refresh
            </button>
          </div>

          {/* Stats Bar — 6 cols on both mobile and desktop */}
          <div className="grid grid-cols-6 gap-1 sm:gap-2.5 mt-2 sm:mt-4 mb-2 sm:mb-5">
            {[
              { label: "Posts",   value: profile.stats.posts,          color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40" },
              { label: "Network", value: profile.stats.connections,     color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50/70 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/40" },
              { label: "Events",  value: profile.stats.eventsAttended,  color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50/70 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40" },
              { label: "Items",   value: profile.stats.itemsSold,       color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40" },
              { label: "Jobs",    value: profile.stats.jobsPosted,      color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50/70 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40" },
              { label: "Sports",  value: profile.stats.sportsPlayed,    color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50/70 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40" },
            ].map((s) => (
              <div key={s.label} className={cn("rounded-xl sm:rounded-2xl py-2 px-1 sm:p-3.5 text-center border", s.bg)}>
                <div className={cn("text-sm sm:text-2xl font-black leading-none", s.color)}>{s.value}</div>
                <div className="text-[7.5px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5 truncate">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tab Navigation — equally distributed, icon+label */}
          <div className="flex -mb-px -mx-4 sm:mx-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 sm:py-2.5 sm:flex-row sm:gap-1.5 sm:px-4 border-b-2 transition-all cursor-pointer",
                    isActive
                      ? "border-primary text-primary bg-primary/3"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Icon className={cn("w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0", isActive && "text-primary")} />
                  <span className={cn("text-[9px] sm:text-[12.5px] font-bold leading-none", isActive && "text-primary")}>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
              {/* Left Column — About & Skills (shown 2nd on mobile, 1st on desktop) */}
              <div className="lg:col-span-2 space-y-5 sm:space-y-6 order-2 lg:order-1">
                {/* About & Contact Cards (Compact View) */}
                <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-3.5 sm:p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold text-foreground text-xs sm:text-sm">About Resident</h2>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                      Resident Details
                    </span>
                  </div>

                  {profile.bio && (
                    <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                      {profile.bio}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg bg-muted/20 border border-border/50 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Email</p>
                        <p className="font-semibold text-foreground text-xs truncate" title={profile.email || "Not Provided"}>
                          {profile.email || "Not Provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg bg-muted/20 border border-border/50 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Phone</p>
                        <p className="font-semibold text-foreground text-xs truncate" title={profile.phone || "Not Provided"}>
                          {profile.phone || "Not Provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg bg-muted/20 border border-border/50 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <Home className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Unit</p>
                        <p className="font-semibold text-foreground text-xs truncate" title={unitDisplay}>
                          {unitDisplay}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg bg-muted/20 border border-border/50 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</p>
                        <p className="font-semibold text-foreground text-xs truncate">
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
                <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
                  <h2 className="font-bold text-foreground text-sm sm:text-base mb-3">Skills & Community Interests</h2>
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

              {/* Right Column — Family & KYC (shown 1st on mobile, 2nd on desktop) */}
              <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
                {/* My Family Summary Card in Overview */}
                <div className="hidden sm:block bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm">My Family</h3>
                        <p className="text-[10px] text-muted-foreground">{familyMembers.length} {familyMembers.length === 1 ? 'member' : 'members'} registered</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("family")}
                      className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
                    >
                      Manage <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-3">
                    {familyMembers.slice(0, 4).map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/50 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn(
                            "w-7 h-7 rounded-lg font-bold flex items-center justify-center text-[11px] shrink-0",
                            member.gender === "Female" ? "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300" : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          )}>
                            {member.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{member.name}</p>
                            <p className="text-[10px] text-muted-foreground">{member.age ? `${member.age} yrs` : member.gender || ""}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                          {member.relation}
                        </span>
                      </div>
                    ))}
                    {familyMembers.length === 0 && (
                      <p className="text-xs text-muted-foreground italic py-2">No family members registered yet.</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("family");
                      handleOpenAddFamily();
                    }}
                    className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Family Member
                  </button>
                </div>

                {/* KYC Status Card — Hidden in mobile view */}
                <div
                  className={cn(
                    "hidden sm:block rounded-2xl border p-5 shadow-sm",
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

          {/* ── MY FAMILY TAB ── */}
          {activeTab === "family" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Header Banner & Stats */}
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 sm:pb-6 border-b border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 shrink-0">
                      <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="font-black text-foreground text-base sm:text-xl tracking-tight flex items-center gap-2 flex-wrap">
                        My Family Directory
                        <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                          {familyMembers.length} Members
                        </span>
                      </h2>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Single unified source of truth for your household. Details here automatically populate across <strong>Events</strong>, <strong>Pooja Sankalpams</strong>, <strong>Sports Tournaments</strong>, and <strong>Gate Passes</strong>.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddFamily}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-md shadow-rose-500/20 text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-4 h-4" /> Add Family Member
                  </button>
                </div>

                {/* Family Metrics Bar: 2x2 on mobile, 4 columns on desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 pt-4">
                  {[
                    { label: "Total Members", value: familyMembers.length, icon: Users, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40" },
                    { label: "Adults (18+)", value: familyMembers.filter(m => (m.age ?? 25) >= 18).length, icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40" },
                    { label: "Kids & Youth", value: familyMembers.filter(m => (m.age ?? 25) < 18).length, icon: Smile, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40" },
                    { label: "Emergency Contacts", value: familyMembers.filter(m => m.emergencyContact).length, icon: Star, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40" },
                  ].map((s) => (
                    <div key={s.label} className={cn("p-2.5 sm:p-3.5 rounded-xl border flex items-center gap-2.5 sm:gap-3", s.bg)}>
                      <div className={cn("w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 bg-background/80", s.color)}>
                        <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-base sm:text-xl font-black truncate", s.color)}>{s.value}</p>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="bg-card rounded-2xl border border-border p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={familySearch}
                    onChange={(e) => setFamilySearch(e.target.value)}
                    placeholder="Search by name, relation, gotram..."
                    className="w-full pl-9 pr-7 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  {familySearch && (
                    <button
                      onClick={() => setFamilySearch("")}
                      className="absolute right-2.5 top-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 sm:mx-0 sm:px-0">
                  {["ALL", "SELF", "SPOUSE", "CHILDREN", "PARENTS", "EMERGENCY"].map((filter) => {
                    const isActive = familyFilterRelation === filter;
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setFamilyFilterRelation(filter)}
                        className={cn(
                          "px-2.5 sm:px-3 py-1.5 text-[10.5px] sm:text-[11px] font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer shrink-0",
                          isActive
                            ? "bg-primary text-white shadow-xs"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {filter === "ALL" && "All Family"}
                        {filter === "SELF" && "Myself (Head)"}
                        {filter === "SPOUSE" && "Spouse"}
                        {filter === "CHILDREN" && "Children"}
                        {filter === "PARENTS" && "Parents"}
                        {filter === "EMERGENCY" && "⭐ Emergency"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Members Grid */}
              {loadingFamily ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin inline mr-2 text-primary" /> Loading family members...
                </div>
              ) : (
                (() => {
                  const filtered = familyMembers.filter((m) => {
                    const q = familySearch.toLowerCase();
                    const matchSearch =
                      !q ||
                      m.name.toLowerCase().includes(q) ||
                      m.relation.toLowerCase().includes(q) ||
                      (m.gotram && m.gotram.toLowerCase().includes(q)) ||
                      (m.phone && m.phone.includes(q));

                    let matchRelation = true;
                    if (familyFilterRelation === "SELF") matchRelation = m.relation.toLowerCase().includes("self") || m.relation.toLowerCase().includes("head");
                    else if (familyFilterRelation === "SPOUSE") matchRelation = m.relation.toLowerCase().includes("spouse") || m.relation.toLowerCase().includes("wife") || m.relation.toLowerCase().includes("husband");
                    else if (familyFilterRelation === "CHILDREN") matchRelation = m.relation.toLowerCase().includes("son") || m.relation.toLowerCase().includes("daughter") || m.relation.toLowerCase().includes("child");
                    else if (familyFilterRelation === "PARENTS") matchRelation = m.relation.toLowerCase().includes("father") || m.relation.toLowerCase().includes("mother") || m.relation.toLowerCase().includes("parent");
                    else if (familyFilterRelation === "EMERGENCY") matchRelation = Boolean(m.emergencyContact);

                    return matchSearch && matchRelation;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-card rounded-2xl border border-dashed border-border p-6 sm:p-10 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                          <Users className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-foreground text-sm sm:text-base">No Family Members Found</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                          {familySearch || familyFilterRelation !== "ALL"
                            ? "No family members match your search or filter criteria."
                            : "You haven't added any family members yet. Add family members to easily register them for community festivals, poojas, and sports tournaments."}
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAddFamily}
                          className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Add Member Now
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {filtered.map((member) => {
                        const isSelf = member.relation.toLowerCase().includes("self") || member.relation.toLowerCase().includes("head") || String(member.id) === "fam-self";
                        const isFemale = member.gender === "Female";
                        return (
                          <div
                            key={member.id}
                            className={cn(
                              "bg-card rounded-2xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between group",
                              isSelf ? "border-indigo-200/80 dark:border-indigo-900/60 ring-1 ring-indigo-500/10" : "border-border"
                            )}
                          >
                            <div>
                              {/* Top Bar: Avatar + Name + Relation + Actions */}
                              <div className="flex items-start justify-between gap-2.5">
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className={cn(
                                    "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl font-black flex items-center justify-center text-sm sm:text-base shrink-0 shadow-sm",
                                    isSelf
                                      ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-500/20"
                                      : isFemale
                                      ? "bg-gradient-to-br from-pink-400 to-rose-600 text-white shadow-rose-500/20"
                                      : "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-blue-500/20"
                                  )}>
                                    {member.name.charAt(0)}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h3 className="font-black text-foreground text-sm sm:text-base truncate">{member.name}</h3>
                                      {isSelf && (
                                        <span className="inline-flex items-center gap-0.5 text-[8.5px] sm:text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                          ★ Primary Resident
                                        </span>
                                      )}
                                      {member.emergencyContact && !isSelf && (
                                        <span className="inline-flex items-center gap-0.5 text-[8.5px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800" title="Emergency Contact">
                                          ★ Emergency
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                                      <span className={cn(
                                        "text-[9.5px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                        isSelf
                                          ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                          : isFemale
                                          ? "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800"
                                          : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                      )}>
                                        {member.relation}
                                      </span>
                                      {member.age && (
                                        <span className="text-[9.5px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                          {member.age} yrs
                                        </span>
                                      )}
                                      {member.gender && (
                                        <span className="text-[9.5px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                          {member.gender}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleEmergency(member)}
                                    className={cn(
                                      "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                                      member.emergencyContact
                                        ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                        : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted"
                                    )}
                                    title={member.emergencyContact ? "Remove from emergency contacts" : "Mark as emergency contact"}
                                  >
                                    <Star className="w-4 h-4 fill-current" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditFamily(member)}
                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                                    title="Edit details"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {!isSelf ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFamilyMember(member.id, member.name)}
                                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                                      title="Remove family member"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span
                                      className="p-1.5 text-muted-foreground/30 cursor-not-allowed"
                                      title="Primary account holder cannot be removed"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Attributes Tags Bar: responsive 1 or 2 columns */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3.5 text-xs">
                                {member.gotram && (
                                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                                    <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Gotram</p>
                                      <p className="font-semibold text-foreground truncate">{member.gotram}</p>
                                    </div>
                                  </div>
                                )}

                                {member.bloodGroup && (
                                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                                    <Droplet className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[9px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Blood Group</p>
                                      <p className="font-semibold text-foreground truncate">{member.bloodGroup}</p>
                                    </div>
                                  </div>
                                )}

                                {member.phone && (
                                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/50 col-span-1 sm:col-span-2">
                                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span className="font-medium text-foreground truncate">{member.phone}</span>
                                  </div>
                                )}
                              </div>

                              {member.notes && (
                                <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-xl mt-2.5 border border-border/40 line-clamp-2">
                                  {member.notes}
                                </p>
                              )}
                            </div>

                            {/* Bottom Module Usage Info */}
                            <div className="mt-3.5 pt-2.5 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Synced to Events & Sports
                              </span>
                              <span className="font-mono text-[9px] text-muted-foreground/60">
                                ID: #{String(member.id).slice(-4)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* Add / Edit Family Member Modal */}
          {isFamilyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
              <div className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl max-w-lg w-full p-4 sm:p-7 relative overflow-hidden animate-scaleUp max-h-[92vh] flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-border mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                        {editingMember ? <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" /> : <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </div>
                      <div>
                        <h3 className="font-black text-foreground text-sm sm:text-lg">
                          {editingMember ? `Edit ${editingMember.name}` : "Add Family Member"}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">Save to household profile database</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFamilyModalOpen(false)}
                      className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveFamilyMember} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter member's full name"
                        value={memberForm.name || ""}
                        onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                        className="w-full px-3.5 py-2 sm:py-2.5 bg-[var(--mana-bg-input)] border border-border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                          Relationship *
                        </label>
                        <select
                          value={memberForm.relation || "Spouse"}
                          onChange={(e) => setMemberForm({ ...memberForm, relation: e.target.value })}
                          className="w-full px-3.5 py-2 sm:py-2.5 bg-[var(--mana-bg-input)] border border-border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                          <option value="Self (Head)">Self (Head)</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Grandfather">Grandfather</option>
                          <option value="Grandmother">Grandmother</option>
                          <option value="In-law">In-law</option>
                          <option value="Other">Other Relative</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                          Gender
                        </label>
                        <select
                          value={memberForm.gender || "Male"}
                          onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                          className="w-full px-3.5 py-2 sm:py-2.5 bg-[var(--mana-bg-input)] border border-border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                          Age (Years)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          placeholder="e.g. 32"
                          value={memberForm.age || ""}
                          onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full px-3.5 py-2 sm:py-2.5 bg-[var(--mana-bg-input)] border border-border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                          Gotram (Pooja / Seva)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Bharadwaj"
                          value={memberForm.gotram || ""}
                          onChange={(e) => setMemberForm({ ...memberForm, gotram: e.target.value })}
                          className="w-full px-3.5 py-2 sm:py-2.5 bg-[var(--mana-bg-input)] border border-border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={memberForm.phone || ""}
                          onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                          className="w-full px-3.5 py-2 sm:py-2.5 bg-[var(--mana-bg-input)] border border-border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                          Blood Group
                        </label>
                        <select
                          value={memberForm.bloodGroup || ""}
                          onChange={(e) => setMemberForm({ ...memberForm, bloodGroup: e.target.value })}
                          className="w-full px-3.5 py-2 sm:py-2.5 bg-[var(--mana-bg-input)] border border-border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                          <option value="">Not Specified</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-muted/40 border border-border">
                      <input
                        type="checkbox"
                        id="emergencyContactCheck"
                        checked={Boolean(memberForm.emergencyContact)}
                        onChange={(e) => setMemberForm({ ...memberForm, emergencyContact: e.target.checked })}
                        className="w-4 h-4 text-primary rounded border-border"
                      />
                      <label htmlFor="emergencyContactCheck" className="text-xs font-semibold text-foreground cursor-pointer">
                        Mark as Emergency Contact
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                        Notes / Preferences
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Special dietary needs, sports interests, etc."
                        value={memberForm.notes || ""}
                        onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                        className="w-full px-3.5 py-2 bg-[var(--mana-bg-input)] border border-border rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setIsFamilyModalOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingMember}
                        className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                      >
                        {isSavingMember ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {editingMember ? "Save Changes" : "Add Member"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
              <div className="lg:col-span-2 space-y-5 sm:space-y-6">
                {/* Personal Info Edit */}
                <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 sm:mb-5">
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
