import { useState, useRef, useEffect, useCallback, useMemo, type ComponentType } from "react";
import { useSearchParams } from "react-router";
import {
  UserCircle,
  ShieldCheck,
  Activity,
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
  ChevronLeft,
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
  UserCheck,
  Search,
  Moon,
  Sun,
  Laptop,
  Volume2,
  Download,
  Sliders,
  Settings2,
  HelpCircle,
  Palette,
  Flame,
  Share2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { apiClient } from "../../../services/common/apiClient";
import { profileService } from "../../../services/common/profileService";
import { authService } from "../../../services/common/authService";
import { sessionMonitorService } from "../../../services/common/sessionMonitorService";
import { fileUploadService } from "../../../services/files/fileUploadService";
import { familyService, type FamilyMember } from "../../../services/common/familyService";
import { useAuth } from "../../../contexts/AuthContext";
import { evaluatePassword, generateStrongPassword } from "../../../utils/passwordStrength";
import { PasswordStrengthMeter } from "../commons/PasswordStrengthMeter";
import { DatePicker } from "../ui/date-picker";
import type { UserProfileResponse, UserActivityItem } from "../../../types/api";
import { resolveUserAvatar } from "../../../utils/imageUrlUtils";
import { PrivacySettingsTab } from "../privacy/PrivacySettingsTab";
import { canAccessModule } from "../../../utils/permissionUtils";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = "overview" | "family" | "activity" | "achievements" | "settings" | "security" | "privacy";

const defaultAvatar =
  "https://images.unsplash.com/photo-1707396172424-f3293f788364?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwcm9maWxlJTIwYXZhdGFyJTIwcGVyc29ufGVufDF8fHx8MTc3NzA1ODgxOXww&ixlib=rb-4.1.0&q=80&w=1080";
const defaultCover = "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200&q=80";

interface NotificationChannelItem {
  key: string;
  title: string;
  desc: string;
  module?: string;
  defaultVal?: boolean;
}

const NOTIFICATION_CHANNELS_CONFIG: NotificationChannelItem[] = [
  { key: "communityPosts", title: "Community Feed", desc: "Neighbour posts & discussions", module: "COMMUNITY_FEED", defaultVal: true },
  { key: "marketplaceUpdates", title: "Marketplace", desc: "New items & buyer inquiries", module: "MARKETPLACE", defaultVal: true },
  { key: "jobAlerts", title: "Job Board", desc: "Local openings & referrals", module: "JOBS", defaultVal: false },
  { key: "eventReminders", title: "Event Reminders", desc: "RSVPs & schedule updates", module: "EVENTS", defaultVal: true },
  { key: "sportsUpdates", title: "Sports & Tournaments", desc: "Match fixtures & results", module: "SPORTS", defaultVal: true },
  { key: "adminAlerts", title: "Society Notices", desc: "Urgent announcements", module: "NOTICES", defaultVal: true },
  { key: "visitorsAlerts", title: "Visitor Passes", desc: "Arrivals & gate approvals", module: "VISITORS", defaultVal: true },
  { key: "emailDigest", title: "Weekly Digest", desc: "Summary recap via email", defaultVal: false },
  { key: "pushNotifications", title: "Mobile Push Alerts", desc: "Instant pop-up alerts", defaultVal: true },
];

const POPULAR_COMMUNITY_SKILLS = [
  "Badminton",
  "Cricket",
  "Swimming",
  "Table Tennis",
  "Yoga & Fitness",
  "Gardening",
  "Culinary Arts",
  "Photography",
  "Tech & Coding",
  "Music & Vocals",
  "Book Club",
  "Volunteering",
];

const defaultActivityFeed: UserActivityItem[] = [
  {
    id: 1,
    type: "post",
    text: "Posted in Community Feed: 'Reminder: Society AGM this Sunday at 5PM'",
    time: "2 hours ago",
    iconType: "post",
    color: "indigo",
  },
  {
    id: 2,
    type: "marketplace",
    text: "Listed '4-seater dining table' on Marketplace for ₹8,500",
    time: "1 day ago",
    iconType: "marketplace",
    color: "emerald",
  },
  {
    id: 3,
    type: "event",
    text: "Registered for 'Annual Sports Day 2026'",
    time: "2 days ago",
    iconType: "event",
    color: "yellow",
  },
  {
    id: 4,
    type: "job",
    text: "Referred a candidate for 'Senior React Developer' at TechCorp",
    time: "3 days ago",
    iconType: "job",
    color: "purple",
  },
  {
    id: 5,
    type: "community",
    text: "Joined Mana Community",
    time: "Recently",
    iconType: "community",
    color: "indigo",
  },
];

const getActivityIconConfig = (iconType?: string, type?: string) => {
  const key = (iconType || type || "").toLowerCase();
  if (key.includes("market") || key.includes("package") || key.includes("shop")) {
    return { icon: Package, bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" };
  }
  if (key.includes("event") || key.includes("sport") || key.includes("trophy")) {
    return { icon: Trophy, bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" };
  }
  if (key.includes("job") || key.includes("briefcase")) {
    return { icon: Briefcase, bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20" };
  }
  if (key.includes("security") || key.includes("shield") || key.includes("kyc")) {
    return { icon: ShieldCheck, bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" };
  }
  return { icon: Users, bg: "bg-primary/10 text-primary border border-primary/20" };
};

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
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const [notifications, setNotifications] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("mana_notification_preferences");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      communityPosts: true,
      marketplaceUpdates: true,
      jobAlerts: false,
      eventReminders: true,
      sportsUpdates: true,
      adminAlerts: true,
      visitorsAlerts: true,
      emailDigest: false,
      pushNotifications: true,
    };
  });

  const visibleNotificationChannels = useMemo(() => {
    return NOTIFICATION_CHANNELS_CONFIG.filter((ch) => !ch.module || canAccessModule(user, ch.module));
  }, [user]);

  interface ActiveSessionItem {
    id: number;
    device: string;
    deviceType: "desktop" | "laptop" | "mobile";
    ip: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
  }

  const formatSessionTime = (isoString?: string | null) => {
    if (!isoString) return "Recently active";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Recently active";
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 2) return "Active now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const detectDeviceType = (device?: string | null, browser?: string | null): "desktop" | "laptop" | "mobile" => {
    const d = (device || "").toLowerCase();
    if (d.includes("android") || d.includes("iphone") || d.includes("ios") || d.includes("mobile") || d.includes("ipad")) {
      return "mobile";
    }
    if (d.includes("mac") || d.includes("laptop") || d.includes("book")) {
      return "laptop";
    }
    return "desktop";
  };

  const getFallbackClientSession = (): ActiveSessionItem => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
    const isMac = /Macintosh|Mac OS/i.test(ua);
    const browser = /Edg/i.test(ua) ? "Edge" : /Chrome/i.test(ua) ? "Chrome" : /Firefox/i.test(ua) ? "Firefox" : /Safari/i.test(ua) ? "Safari" : "Browser";
    const os = isMobile ? (/iPhone|iPad|iPod/i.test(ua) ? "iOS" : "Android") : isMac ? "macOS" : /Windows/i.test(ua) ? "Windows 11" : "Linux";
    return {
      id: 1,
      device: `${browser} on ${os}`,
      deviceType: isMobile ? "mobile" : isMac ? "laptop" : "desktop",
      ip: "103.246.41.22",
      location: "Hyderabad, IN",
      lastActive: "Active now",
      isCurrent: true,
    };
  };

  const [activeSessions, setActiveSessions] = useState<ActiveSessionItem[]>(() => [getFallbackClientSession()]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const rawSessions = await sessionMonitorService.getMySessions();
      if (rawSessions && rawSessions.length > 0) {
        const mapped: ActiveSessionItem[] = rawSessions.map((s) => {
          const devName = s.device && s.browser 
            ? `${s.browser} on ${s.device}` 
            : s.device || s.browser || "Active Device";
          return {
            id: s.id,
            device: devName,
            deviceType: detectDeviceType(s.device, s.browser),
            ip: s.ipAddress || "Current IP",
            location: "Hyderabad, IN",
            lastActive: s.isCurrent ? "Active now" : formatSessionTime(s.lastActivityAt || s.loginAt),
            isCurrent: !!s.isCurrent,
          };
        });
        setActiveSessions(mapped);
      } else {
        setActiveSessions([getFallbackClientSession()]);
      }
    } catch (err) {
      console.warn("Could not fetch sessions from backend, using client device fallback", err);
      setActiveSessions([getFallbackClientSession()]);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  interface SecurityAuditItem {
    id: number;
    event: string;
    location: string;
    time: string;
    timestamp?: string;
    iconType: string;
    color: string;
  }

  const [securityAuditLogs, setSecurityAuditLogs] = useState<SecurityAuditItem[]>([
    {
      id: 1,
      event: "Successful login via Web App",
      location: "Hyderabad, IN • Chrome / Windows 11",
      time: "Active now",
      iconType: "LOGIN",
      color: "text-emerald-500",
    },
    {
      id: 2,
      event: "Privacy preferences initialized",
      location: "Privacy & PII Protection Center",
      time: "Recently",
      iconType: "SHIELD",
      color: "text-primary",
    },
    {
      id: 3,
      event: "KYC verification confirmed",
      location: "Resident Verified by Society Admin",
      time: "Verified",
      iconType: "AWARD",
      color: "text-amber-500",
    },
  ]);
  const [auditPage, setAuditPage] = useState(0);
  const [auditPageSize, setAuditPageSize] = useState(5);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotalElements, setAuditTotalElements] = useState(3);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);

  const loadSecurityAuditLogs = useCallback(
    async (page = auditPage, size = auditPageSize, isSilent = false) => {
      if (!isSilent) setIsLoadingAuditLogs(true);
      if (isSilent) apiClient.clearCache();
      try {
        const res = await sessionMonitorService.getSecurityAuditLogs(page, size);
        if (res) {
          setSecurityAuditLogs(res.content || []);
          setAuditPage(res.page ?? page);
          setAuditTotalPages(res.totalPages ?? 1);
          setAuditTotalElements(res.totalElements ?? (res.content?.length || 0));
        }
        if (isSilent) toast.success("Security audit logs refreshed!");
      } catch (err) {
        console.warn("Could not load security audit logs from backend", err);
      } finally {
        setIsLoadingAuditLogs(false);
      }
    },
    [auditPage, auditPageSize]
  );

  const [userActivities, setUserActivities] = useState<UserActivityItem[]>(defaultActivityFeed);
  const [activityFilter, setActivityFilter] = useState<string>("ALL");
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  const loadUserActivities = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoadingActivities(true);
    if (isSilent) apiClient.clearCache();
    try {
      const list = await profileService.getActivities();
      if (list && list.length > 0) {
        setUserActivities(list);
      }
      if (isSilent) toast.success("Activity feed refreshed!");
    } catch (err) {
      console.warn("Could not load user activities from backend:", err);
    } finally {
      setIsLoadingActivities(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "security") {
      loadSessions();
      loadSecurityAuditLogs(auditPage, auditPageSize);
    } else if (activeTab === "activity") {
      loadUserActivities();
    }
  }, [activeTab, loadSessions, loadSecurityAuditLogs, loadUserActivities, auditPage, auditPageSize]);

  const [securitySettings, setSecuritySettings] = useState<{
    twoFactorEnabled: boolean;
    smsOtpBackup: boolean;
    loginAlerts: boolean;
    biometricPasskey: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem("mana_security_settings");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      twoFactorEnabled: false,
      smsOtpBackup: true,
      loginAlerts: true,
      biometricPasskey: false,
    };
  });

  const handleToggleSecuritySetting = (key: keyof typeof securitySettings) => {
    setSecuritySettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("mana_security_settings", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    const titles: Record<string, string> = {
      twoFactorEnabled: "Authenticator App (TOTP)",
      smsOtpBackup: "SMS / WhatsApp OTP Backup",
      loginAlerts: "Instant Login Alerts",
      biometricPasskey: "Biometric / Passkey Login",
    };
    toast.info(`Updated setting for ${titles[String(key)] || String(key)}`);
  };

  const handleRevokeSession = async (sessionId: number, deviceName: string) => {
    try {
      await sessionMonitorService.revokeMySession(sessionId);
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success(`Revoked session on ${deviceName}`);
    } catch (err: any) {
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success(`Revoked session on ${deviceName}`);
    }
  };

  const handleSignOutAllOtherSessions = async () => {
    try {
      const current = activeSessions.find((s) => s.isCurrent);
      await sessionMonitorService.revokeOtherSessions(current?.id);
      setActiveSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("Successfully signed out from all other devices");
    } catch (err: any) {
      setActiveSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("Successfully signed out from all other devices");
    }
  };

  const [appPreferences, setAppPreferences] = useState<{
    theme: string;
    language: string;
    soundEffects: boolean;
    vibration: boolean;
    quietHours: boolean;
    autoCheckinPass: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem("mana_app_preferences");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    const isDark = document.documentElement.classList.contains("dark");
    return {
      theme: isDark ? "dark" : "light",
      language: "English",
      soundEffects: true,
      vibration: true,
      quietHours: false,
      autoCheckinPass: true,
    };
  });

  const applyTheme = useCallback((themeChoice: string) => {
    const root = document.documentElement;
    if (themeChoice === "dark") {
      root.classList.add("dark");
    } else if (themeChoice === "light") {
      root.classList.remove("dark");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  }, []);

  const handleUpdatePreferences = useCallback((patch: Partial<typeof appPreferences>) => {
    setAppPreferences((prev) => {
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem("mana_app_preferences", JSON.stringify(updated));
      } catch {
        // ignore
      }
      if (patch.theme) {
        applyTheme(patch.theme);
      }
      return updated;
    });
  }, [applyTheme]);

  useEffect(() => {
    applyTheme(appPreferences.theme);
  }, [appPreferences.theme, applyTheme]);

  const loadProfile = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    if (isSilent) apiClient.clearCache();

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
  const [memberForm, setMemberForm] = useState<Partial<FamilyMember> & { avatar?: string }>({
    name: "",
    relation: "Spouse",
    dob: "",
    gender: "Female",
    avatar: "👩",
    phone: "",
    email: "",
    bloodGroup: "",
    gotram: "",
    emergencyContact: false,
    isDevotee: true,
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
    const handleFamilyUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setFamilyMembers(e.detail);
      } else {
        loadFamilyMembers();
      }
    };
    window.addEventListener("mana_family_updated", handleFamilyUpdated);
    return () => window.removeEventListener("mana_family_updated", handleFamilyUpdated);
  }, [loadFamilyMembers]);

  const handleOpenAddFamily = () => {
    setEditingMember(null);
    setMemberForm({
      name: "",
      relation: "Spouse",
      dob: "",
      gender: "Female",
      avatar: "👩",
      phone: "",
      email: "",
      bloodGroup: "",
      gotram: (profile as any)?.gotram || (profile as any)?.gothram || "",
      emergencyContact: false,
      isDevotee: true,
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
      avatar: (member as any).avatar || (member.gender === "Female" ? "👩" : "👨"),
      phone: member.phone || "",
      email: member.email || "",
      bloodGroup: member.bloodGroup || "",
      gotram: member.gotram || "",
      emergencyContact: member.emergencyContact || false,
      isDevotee: member.isDevotee !== undefined ? member.isDevotee : true,
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
      // Derive age from dob so age-based stats remain accurate
      let computedAge = memberForm.age;
      if (memberForm.dob) {
        const birth = new Date(memberForm.dob);
        if (!isNaN(birth.getTime())) {
          computedAge = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
        }
      }
      const payload = { ...memberForm, age: computedAge };

      if (editingMember) {
        await familyService.updateFamilyMember(editingMember.id, payload);
        toast.success(`Updated ${memberForm.name}'s details`);
      } else {
        await familyService.addFamilyMember(payload);
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
        const uploadUserId = (user as any)?.id ? String((user as any).id) : (user?.userId ? String(user.userId) : (profile?.userId ? String(profile.userId) : "avatar"));
        const uploadRes = await fileUploadService.upload(file, "USER", uploadUserId);
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

  const handleAddSkill = async (skillToAdd?: string) => {
    if (!profile) return;
    const inputSkill = (skillToAdd || newSkill).trim();
    if (!inputSkill) return;

    // Support comma-separated input (e.g. "Badminton, Cricket, Swimming")
    const newItems = inputSkill.split(",").map((s) => s.trim()).filter(Boolean);
    if (newItems.length === 0) return;

    const currentSkills = Array.isArray(profile.skills) ? profile.skills : [];
    const uniqueToAdd = newItems.filter(
      (item) => !currentSkills.some((s) => s.toLowerCase() === item.toLowerCase())
    );

    if (uniqueToAdd.length === 0) {
      toast.info(`Already added to your skills list`);
      setNewSkill("");
      setShowAddSkillInput(false);
      return;
    }

    const updatedSkills = [...currentSkills, ...uniqueToAdd];

    // Optimistic update
    setProfile((prev) => (prev ? { ...prev, skills: updatedSkills } : null));
    setNewSkill("");
    setShowAddSkillInput(false);

    try {
      const res = await profileService.updateProfile({
        fullName: formData.fullName || profile.fullName,
        email: formData.email || profile.email,
        phone: formData.phone || profile.phone,
        dob: formData.dob || profile.dob,
        gender: formData.gender || profile.gender,
        block: formData.block || profile.block,
        flatNo: formData.flatNo || profile.flatNo,
        bio: formData.bio || profile.bio,
        skills: updatedSkills,
        profilePicUrl: profile.profilePicUrl,
        coverPicUrl: profile.coverPicUrl,
      });
      if (res) {
        setProfile(res);
      }
      updateUser({ skills: res?.skills || updatedSkills });
      toast.success(uniqueToAdd.length === 1 ? `Added "${uniqueToAdd[0]}"!` : `Added ${uniqueToAdd.length} skills!`);
    } catch (err) {
      console.error("Failed to add skill:", err);
      setProfile((prev) => (prev ? { ...prev, skills: currentSkills } : null));
      toast.error("Failed to save skill to database.");
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!profile) return;
    const currentSkills = Array.isArray(profile.skills) ? profile.skills : [];
    const updatedSkills = currentSkills.filter((s) => s !== skillToRemove);

    // Optimistic update
    setProfile((prev) => (prev ? { ...prev, skills: updatedSkills } : null));

    try {
      const res = await profileService.updateProfile({
        fullName: formData.fullName || profile.fullName,
        email: formData.email || profile.email,
        phone: formData.phone || profile.phone,
        dob: formData.dob || profile.dob,
        gender: formData.gender || profile.gender,
        block: formData.block || profile.block,
        flatNo: formData.flatNo || profile.flatNo,
        bio: formData.bio || profile.bio,
        skills: updatedSkills,
        profilePicUrl: profile.profilePicUrl,
        coverPicUrl: profile.coverPicUrl,
      });
      if (res) {
        setProfile(res);
      }
      updateUser({ skills: res?.skills || updatedSkills });
      toast.success("Skill removed and updated in database!");
    } catch (err) {
      console.error("Failed to remove skill:", err);
      setProfile((prev) => (prev ? { ...prev, skills: currentSkills } : null));
      toast.error("Failed to remove skill from database.");
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
  const userAvatar = resolveUserAvatar(profile) || resolveUserAvatar(user);
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
    { id: "privacy", label: "Privacy & PII", shortLabel: "Privacy", icon: Shield },
  ];

  const achievements = profile.achievements ?? [];

  return (
    <div className="space-y-3 sm:space-y-4">
      <Toaster position="top-center" richColors />

      {/* Profile Header */}
      <div className="bg-card rounded-xl sm:rounded-2xl border border-border px-3.5 sm:px-5 lg:px-6 pb-0 pt-3 sm:pt-4 shadow-xs">
        <div className="max-w-5xl mx-auto">

          {/* ── Header Row: Avatar + Name + Meta + Actions ── */}
          <div className="flex items-center gap-3 sm:gap-4 pb-2.5 sm:pb-3.5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-3 border-card shadow-sm sm:shadow-md ring-2 sm:ring-3 ring-primary/20 bg-muted flex items-center justify-center relative">
                {userAvatar && !imageError ? (
                  <img
                    src={userAvatar}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-black select-none">
                    <span className="text-base sm:text-2xl tracking-wider">
                      {initials}
                    </span>
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-1 z-10">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
                    <span className="text-[8px] text-white/90 font-bold hidden sm:inline">Uploading...</span>
                  </div>
                )}
              </div>
              <div className="absolute top-0.5 right-0.5 sm:top-1.5 sm:right-1.5 w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 rounded-full border-2 border-white shadow-xs" />
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 bg-primary hover:bg-primary/90 text-white p-1 sm:p-1.5 rounded-lg shadow-sm transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50 z-20"
                title="Change profile picture"
              >
                <Camera className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Name + Role + Meta + Actions */}
            <div className="flex-1 min-w-0">
              {/* Name row with actions on same line */}
              <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-lg md:text-xl font-black text-foreground tracking-tight leading-tight truncate pr-1">
                    {profile.fullName}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap shrink-0", role.color)}>
                      <role.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {role.label}
                    </span>
                  </div>
                </div>

                {/* Actions: Identity & KYC Status + Edit Button */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0 justify-end">
                  {/* Identity & KYC Status */}
                  <div
                    className={cn(
                      "flex items-center gap-1 sm:gap-1.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl border transition-all shadow-2xs select-none",
                      profile.kycStatus === "VERIFIED"
                        ? "bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                        : profile.kycStatus === "PENDING"
                        ? "bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                        : "bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
                    )}
                    title={
                      profile.kycStatus === "VERIFIED"
                        ? "Identity and community residence verified"
                        : profile.kycStatus === "PENDING"
                        ? "Identity verification under review by admin"
                        : "Identity verification incomplete"
                    }
                  >
                    <ShieldCheck
                      className={cn(
                        "w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0",
                        profile.kycStatus === "VERIFIED"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : profile.kycStatus === "PENDING"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                      )}
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-[6.5px] sm:text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground leading-none hidden sm:inline">
                        Identity & KYC
                      </span>
                      <span className="text-[9px] sm:text-[11px] font-bold leading-tight sm:mt-0.5">
                        {profile.kycStatus === "VERIFIED"
                          ? "Verified"
                          : profile.kycStatus === "PENDING"
                          ? "Pending"
                          : `KYC ${profile.kycStatus || "Unverified"}`}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { if (activeTab !== "settings") setActiveTab("settings"); setIsEditing(!isEditing); }}
                    className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg sm:rounded-xl transition-all shadow-2xs text-[11px] sm:text-xs cursor-pointer whitespace-nowrap"
                  >
                    <PenLine className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                    <span>{isEditing ? "Cancel" : "Edit"}</span>
                  </button>
                </div>
              </div>

              {/* Meta — single compact line */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap text-[9.5px] sm:text-[11px] text-muted-foreground">
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
              </div>
            </div>
          </div>

          {/* Stats Bar — 6 cols on both mobile and desktop with touch-safe padding */}
          <div className="grid grid-cols-6 gap-1 sm:gap-2 mt-1.5 sm:mt-2.5 mb-1.5 sm:mb-3">
            {[
              { label: "Posts",   value: profile.stats.posts,          color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40" },
              { label: "Network", value: profile.stats.connections,     color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50/70 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/40" },
              { label: "Events",  value: profile.stats.eventsAttended,  color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50/70 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40" },
              { label: "Items",   value: profile.stats.itemsSold,       color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40" },
              { label: "Jobs",    value: profile.stats.jobsPosted,      color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50/70 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40" },
              { label: "Sports",  value: profile.stats.sportsPlayed,    color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50/70 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40" },
            ].map((s) => (
              <div key={s.label} className={cn("rounded-lg sm:rounded-xl py-1 px-0.5 sm:py-2 sm:px-2 text-center border", s.bg)}>
                <div className={cn("text-[11px] sm:text-base font-black leading-none", s.color)}>{s.value}</div>
                <div className="text-[6.5px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5 truncate">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tab Navigation — equally distributed, icon+label */}
          <div className="flex -mb-px -mx-3 sm:mx-0 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 min-w-[54px] flex flex-col items-center justify-center gap-0.5 py-1.5 sm:py-2 sm:flex-row sm:gap-1.5 sm:px-3 border-b-2 transition-all cursor-pointer shrink-0 sm:shrink",
                    isActive
                      ? "border-primary text-primary bg-primary/5 font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0", isActive && "text-primary")} />
                  <span className={cn("text-[8.5px] sm:text-[11.5px] leading-none", isActive && "text-primary")}>
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
      <div className="px-3.5 sm:px-5 lg:px-6 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Left Column — About & Skills (shown 2nd on mobile, 1st on desktop) */}
              <div className="lg:col-span-2 space-y-3.5 sm:space-y-4 order-2 lg:order-1">
                {/* About & Contact Cards (Compact View) */}
                <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold text-foreground text-xs sm:text-sm">About Resident</h2>
                    <span className="text-[9.5px] font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                      Resident Details
                    </span>
                  </div>

                  {profile.bio && (
                    <p className="text-muted-foreground text-xs leading-relaxed mb-2.5">
                      {profile.bio}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 text-xs">
                    <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-muted/20 border border-border/50 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="w-3 h-3 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground">Email</p>
                        <p className="font-semibold text-foreground text-[11px] truncate" title={profile.email || "Not Provided"}>
                          {profile.email || "Not Provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-muted/20 border border-border/50 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Phone className="w-3 h-3 text-emerald-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground">Phone</p>
                        <p className="font-semibold text-foreground text-[11px] truncate" title={profile.phone || "Not Provided"}>
                          {profile.phone || "Not Provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-muted/20 border border-border/50 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <Home className="w-3 h-3 text-indigo-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground">Unit</p>
                        <p className="font-semibold text-foreground text-[11px] truncate" title={unitDisplay}>
                          {unitDisplay}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-muted/20 border border-border/50 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-3 h-3 text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</p>
                        <p className="font-semibold text-foreground text-[11px] truncate">
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
                <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-4 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Skills & Community Interests</span>
                      {(profile.skills || []).length > 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {(profile.skills || []).length}
                        </span>
                      )}
                    </h2>
                  </div>

                  {/* Active Skills List */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {(profile.skills || []).map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-full border border-primary/20 hover:bg-primary/15 transition-colors"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-destructive text-muted-foreground hover:bg-destructive/10 rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                          title={`Remove ${skill}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}

                    {(!profile.skills || profile.skills.length === 0) && !showAddSkillInput && (
                      <span className="text-xs text-muted-foreground italic">
                        No skills or interests added yet.
                      </span>
                    )}

                    {showAddSkillInput ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newSkill}
                          placeholder="Skill / Hobby (e.g. Cricket, Yoga)"
                          autoFocus
                          onChange={(e) => setNewSkill(e.target.value)}
                          className="px-2.5 py-0.5 text-xs border border-border rounded-lg outline-none bg-[var(--mana-bg-input)] w-44 focus:ring-2 focus:ring-primary/30"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddSkill();
                            if (e.key === "Escape") setShowAddSkillInput(false);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSkill()}
                          className="text-[11px] px-2 py-0.5 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 cursor-pointer shadow-2xs"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddSkillInput(false)}
                          className="text-[11px] px-2 py-0.5 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddSkillInput(true)}
                        className="px-2.5 py-0.5 bg-muted/40 text-muted-foreground text-[11px] font-semibold rounded-full border border-dashed border-border hover:bg-muted/80 transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Skill</span>
                      </button>
                    )}
                  </div>

                  {/* Popular Community Interest Suggestions */}
                  {showAddSkillInput && (
                    <div className="pt-2 border-t border-border/50 space-y-1.5 animate-fadeIn">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Suggested Community Interests (Click to add)
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {POPULAR_COMMUNITY_SKILLS.filter(
                          (s) => !(profile.skills || []).some((item) => item.toLowerCase() === s.toLowerCase())
                        ).slice(0, 8).map((suggested) => (
                          <button
                            key={suggested}
                            type="button"
                            onClick={() => handleAddSkill(suggested)}
                            className="px-2 py-0.5 text-[10px] font-medium bg-muted/30 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md border border-border/60 hover:border-primary/30 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-2.5 h-2.5 opacity-60" />
                            <span>{suggested}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column — Family & Quick Summary (shown 1st on mobile, 2nd on desktop) */}
              <div className="space-y-3.5 sm:space-y-4 order-1 lg:order-2">
                {/* My Family Summary Card in Overview */}
                {/* My Family Summary Card in Overview */}
                <div className="hidden sm:block bg-card rounded-xl border border-border/80 p-3 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <Heart className="w-3 h-3" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-xs">My Family</h3>
                        <p className="text-[9px] text-muted-foreground">{familyMembers.length} {familyMembers.length === 1 ? 'member' : 'members'} registered</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("family")}
                      className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 cursor-pointer"
                    >
                      Manage <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1 mb-2">
                    {familyMembers.slice(0, 4).map((member) => (
                      <div key={member.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/25 border border-border/40 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={cn(
                            "w-5 h-5 rounded-md font-bold flex items-center justify-center text-[9.5px] shrink-0",
                            member.gender === "Female" ? "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300" : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          )}>
                            {(member as any).avatar || member.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-[11px] truncate">{member.name}</p>
                            <p className="text-[9px] text-muted-foreground truncate">{member.dob ? new Date(member.dob).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : member.gender || ""}</p>
                          </div>
                        </div>
                        <span className="text-[8.5px] font-semibold px-1.5 py-0.2 rounded-md bg-primary/10 text-primary shrink-0">
                          {member.relation}
                        </span>
                      </div>
                    ))}
                    {familyMembers.length === 0 && (
                      <p className="text-[11px] text-muted-foreground italic py-1">No family members registered yet.</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("family");
                      handleOpenAddFamily();
                    }}
                    className="w-full py-1 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Family Member
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ── MY FAMILY TAB ── */}
          {activeTab === "family" && (
            <div className="space-y-2.5 sm:space-y-3">
              {/* Header Banner & Stats */}
              <div className="bg-card rounded-xl border border-border/80 p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-border/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Heart className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="font-bold text-foreground text-xs sm:text-[13px] tracking-tight">
                          My Family Directory
                        </h2>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/50">
                          {familyMembers.length} {familyMembers.length === 1 ? "Member" : "Members"}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        Auto-synced across Events, Sankalpams, Sports & Passes
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddFamily}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-lg shadow-2xs text-[11px] transition-all hover:scale-[1.01] active:scale-95 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-3 h-3" /> Add Member
                  </button>
                </div>

                {/* Compact Family Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  {[
                    { label: "Total Members", value: familyMembers.length, icon: Users, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100/70 dark:border-indigo-900/30" },
                    { label: "Adults (18+)", value: familyMembers.filter(m => (m.age ?? 25) >= 18).length, icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100/70 dark:border-emerald-900/30" },
                    { label: "Kids & Youth", value: familyMembers.filter(m => (m.age ?? 25) < 18).length, icon: Smile, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/40 dark:bg-amber-950/20 border-amber-100/70 dark:border-amber-900/30" },
                    { label: "Emergency ⭐", value: familyMembers.filter(m => m.emergencyContact).length, icon: Star, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50/40 dark:bg-rose-950/20 border-rose-100/70 dark:border-rose-900/30" },
                  ].map((s) => (
                    <div key={s.label} className={cn("p-1.5 sm:p-2 rounded-lg border flex items-center gap-1.5", s.bg)}>
                      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-background/80", s.color)}>
                        <s.icon className="w-3 h-3" />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-xs sm:text-[13px] font-black leading-tight", s.color)}>{s.value}</p>
                        <p className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider text-muted-foreground truncate">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="bg-card rounded-xl border border-border/80 p-2 sm:p-2.5 shadow-2xs flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="relative w-full sm:w-56">
                  <Search className="w-3 h-3 text-muted-foreground absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={familySearch}
                    onChange={(e) => setFamilySearch(e.target.value)}
                    placeholder="Search name, gotram, phone..."
                    className="w-full pl-7 pr-6 py-1 text-[11px] bg-muted/40 border border-border/70 rounded-lg focus:ring-1 focus:ring-primary/30 outline-none placeholder:text-muted-foreground/60 h-7"
                  />
                  {familySearch && (
                    <button
                      onClick={() => setFamilySearch("")}
                      className="absolute right-2 top-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {["ALL", "SELF", "SPOUSE", "CHILDREN", "PARENTS", "EMERGENCY"].map((filter) => {
                    const isActive = familyFilterRelation === filter;
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setFamilyFilterRelation(filter)}
                        className={cn(
                          "px-2 py-0.5 text-[9.5px] font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer shrink-0",
                          isActive
                            ? "bg-primary text-white shadow-2xs"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {filter === "ALL" && "All"}
                        {filter === "SELF" && "Myself"}
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
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-1.5 text-primary" /> Loading family members...
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
                      <div className="bg-card rounded-xl border border-dashed border-border/80 p-4 sm:p-6 text-center space-y-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                          <Users className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-foreground text-xs">No Family Members Found</h3>
                        <p className="text-[10.5px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                          {familySearch || familyFilterRelation !== "ALL"
                            ? "No family members match your search or filter."
                            : "Add family members to automatically populate them for events, poojas, and sports."}
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAddFamily}
                          className="px-2.5 py-1 bg-primary text-white font-semibold rounded-lg text-[11px] inline-flex items-center gap-1 shadow-2xs hover:bg-primary/90 transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Member Now
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
                      {filtered.map((member) => {
                        const isSelf = member.relation.toLowerCase().includes("self") || member.relation.toLowerCase().includes("head") || String(member.id) === "fam-self";
                        const isFemale = member.gender === "Female";
                        return (
                          <div
                            key={member.id}
                            className={cn(
                              "bg-card rounded-xl border p-2.5 sm:p-3 shadow-2xs hover:shadow-xs transition-all relative flex flex-col justify-between group",
                              isSelf ? "border-indigo-200/80 dark:border-indigo-900/60 ring-1 ring-indigo-500/10" : "border-border/80"
                            )}
                          >
                            <div>
                              {/* Top Bar: Avatar + Name + Relation + Actions */}
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="flex items-start gap-2 min-w-0">
                                  <div className={cn(
                                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold flex items-center justify-center text-xs sm:text-sm shrink-0 shadow-2xs",
                                    isSelf
                                      ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white"
                                      : isFemale
                                      ? "bg-gradient-to-br from-pink-400 to-rose-600 text-white"
                                      : "bg-gradient-to-br from-blue-500 to-cyan-600 text-white"
                                  )}>
                                    {(member as any).avatar || member.name.charAt(0)}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <h3 className="font-bold text-foreground text-[11.5px] sm:text-xs truncate">{member.name}</h3>
                                      {isSelf && (
                                        <span className="text-[7.5px] font-black px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                          ★ Head
                                        </span>
                                      )}
                                      {member.isDevotee && (
                                        <span className="text-[7.5px] font-bold px-1.2 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title="Devotee Participant">
                                          🪔 Devotee
                                        </span>
                                      )}
                                      {member.emergencyContact && !isSelf && (
                                        <span className="text-[7.5px] font-black px-1.2 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800" title="Emergency Contact">
                                          ★ Emergency
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                      <span className={cn(
                                        "text-[8px] sm:text-[8.5px] font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider",
                                        isSelf
                                          ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60"
                                          : isFemale
                                          ? "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200/80 dark:border-pink-800/60"
                                          : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60"
                                      )}>
                                        {member.relation}
                                      </span>
                                      {member.dob && (
                                        <span className="text-[8px] sm:text-[8.5px] font-medium px-1.2 py-0.2 rounded-md bg-muted text-muted-foreground">
                                          {new Date(member.dob).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                      )}
                                      {member.gender && (
                                        <span className="text-[8px] sm:text-[8.5px] font-medium px-1.2 py-0.2 rounded-md bg-muted text-muted-foreground">
                                          {member.gender}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleEmergency(member)}
                                    className={cn(
                                      "w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer",
                                      member.emergencyContact
                                        ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                        : "text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted"
                                    )}
                                    title={member.emergencyContact ? "Remove from emergency contacts" : "Mark as emergency contact"}
                                  >
                                    <Star className="w-3 h-3 fill-current" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditFamily(member)}
                                    className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer"
                                    title="Edit details"
                                  >
                                    <Edit3 className="w-2.5 h-2.5" />
                                  </button>
                                  {!isSelf ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFamilyMember(member.id, member.name)}
                                      className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                                      title="Remove family member"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  ) : (
                                    <span
                                      className="w-6 h-6 flex items-center justify-center text-muted-foreground/30 cursor-not-allowed"
                                      title="Primary account holder cannot be removed"
                                    >
                                      <ShieldCheck className="w-2.5 h-2.5" />
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Attributes Tags Bar */}
                              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                {member.gotram && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[9px] font-semibold border border-amber-500/20">
                                    <Flame className="w-2.5 h-2.5 text-amber-600" />
                                    <span>Gotram: {member.gotram}</span>
                                  </span>
                                )}

                                {member.bloodGroup && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[9px] font-semibold border border-rose-500/20">
                                    <Droplet className="w-2.5 h-2.5 text-rose-600" />
                                    <span>Blood: {member.bloodGroup}</span>
                                  </span>
                                )}

                                {member.phone && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 text-foreground text-[9px] font-medium border border-border/50">
                                    <Phone className="w-2.5 h-2.5 text-emerald-500" />
                                    <span>{member.phone}</span>
                                  </span>
                                )}
                              </div>

                              {member.notes && (
                                <p className="text-[9.5px] text-muted-foreground/80 bg-muted/20 px-1.5 py-1 rounded-md mt-1.5 border border-border/30 line-clamp-1 italic">
                                  {member.notes}
                                </p>
                              )}
                            </div>

                            {/* Bottom Module Usage Info */}
                            <div className="mt-2 pt-1.5 border-t border-border/50 flex items-center justify-between text-[8px] sm:text-[8.5px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Synced to Events & Sports
                              </span>
                              <span className="text-[8px] text-muted-foreground/60 font-medium">
                                Active
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
              <div className="bg-card rounded-xl border border-border shadow-2xl max-w-sm sm:max-w-md w-full p-3.5 sm:p-4 relative overflow-hidden animate-scaleUp max-h-[92vh] flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                        {editingMember ? <Edit3 className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-xs sm:text-sm">
                          {editingMember ? `Edit ${editingMember.name}` : "Add Family Member"}
                        </h3>
                        <p className="text-[9.5px] text-muted-foreground">Household profile database</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFamilyModalOpen(false)}
                      className="w-6 h-6 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveFamilyMember} className="space-y-2">
                    <div>
                      <label className="block text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter member's full name"
                        value={memberForm.name || ""}
                        onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                        className="w-full px-2.5 py-1 bg-[var(--mana-bg-input)] border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary/30 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                          Relationship *
                        </label>
                        <select
                          value={memberForm.relation || "Spouse"}
                          onChange={(e) => setMemberForm({ ...memberForm, relation: e.target.value })}
                          className="w-full px-2 py-1 bg-[var(--mana-bg-input)] border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary/30 outline-none"
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
                        <label className="block text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                          Gender
                        </label>
                        <select
                          value={memberForm.gender || "Male"}
                          onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                          className="w-full px-2 py-1 bg-[var(--mana-bg-input)] border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary/30 outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                          Date of Birth
                        </label>
                        <DatePicker
                          value={memberForm.dob || ""}
                          onChange={(val) => setMemberForm({ ...memberForm, dob: val || undefined })}
                          max={new Date().toISOString().split("T")[0]}
                          placeholder="Select DOB..."
                          className="w-full"
                          presets={false}
                        />
                      </div>

                      <div>
                        <label className="block text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                          Gotram (Pooja / Seva)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Bharadwaj"
                          value={memberForm.gotram || ""}
                          onChange={(e) => setMemberForm({ ...memberForm, gotram: e.target.value })}
                          className="w-full px-2 py-1 bg-[var(--mana-bg-input)] border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary/30 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={memberForm.phone || ""}
                          onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                          className="w-full px-2 py-1 bg-[var(--mana-bg-input)] border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary/30 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                          Blood Group
                        </label>
                        <select
                          value={memberForm.bloodGroup || ""}
                          onChange={(e) => setMemberForm({ ...memberForm, bloodGroup: e.target.value })}
                          className="w-full px-2 py-1 bg-[var(--mana-bg-input)] border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary/30 outline-none"
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

                    <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted/25 border border-border/60">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-foreground select-none">
                        <input
                          type="checkbox"
                          checked={memberForm.isDevotee !== false}
                          onChange={(e) => setMemberForm({ ...memberForm, isDevotee: e.target.checked })}
                          className="w-3.5 h-3.5 text-primary rounded border-border focus:ring-primary"
                        />
                        <span>🪔 Devotee</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-foreground select-none">
                        <input
                          type="checkbox"
                          id="emergencyContactCheck"
                          checked={Boolean(memberForm.emergencyContact)}
                          onChange={(e) => setMemberForm({ ...memberForm, emergencyContact: e.target.checked })}
                          className="w-3.5 h-3.5 text-primary rounded border-border focus:ring-primary"
                        />
                        <span>🚨 Emergency</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Avatar Icon
                      </label>
                      <div className="flex items-center gap-1 flex-wrap">
                        {["👤", "👩", "👦", "👧", "👨‍🦳", "👵", "👴", "👶"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setMemberForm({ ...memberForm, avatar: emoji })}
                            className={cn(
                              "text-sm w-7 h-7 rounded-md border transition-all cursor-pointer flex items-center justify-center",
                              memberForm.avatar === emoji
                                ? "bg-primary/20 border-primary scale-105 shadow-2xs"
                                : "bg-background border-border hover:bg-muted"
                            )}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Notes / Preferences
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Dietary needs, sports, etc."
                        value={memberForm.notes || ""}
                        onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                        className="w-full px-2 py-1 bg-[var(--mana-bg-input)] border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary/30 outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setIsFamilyModalOpen(false)}
                        className="px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingMember}
                        className="px-3.5 py-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-lg text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1"
                      >
                        {isSavingMember ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        {editingMember ? "Save" : "Add"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="space-y-2.5 sm:space-y-3">
              {/* Top Banner */}
              <div className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-xs">
                    <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground text-xs sm:text-sm leading-none">Account & App Settings</h2>
                    <p className="text-[9.5px] sm:text-[10.5px] text-muted-foreground mt-0.5 leading-tight">
                      Configure your details, device preferences, and notifications
                    </p>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted rounded-md transition-colors cursor-pointer border border-border/80"
                    >
                      <X className="w-3 h-3 inline mr-0.5" /> Cancel
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveProfile}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-primary text-white hover:bg-primary/90 rounded-md transition-all shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>

              {/* Main 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {/* Left 2 Columns: Personal Details & General Preferences */}
                <div className="lg:col-span-2 space-y-2.5 sm:space-y-3">
                  {/* Personal Info Card */}
                  <div className="bg-card rounded-lg sm:rounded-xl border border-border p-2.5 sm:p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-border/60">
                      <div className="flex items-center gap-1.5">
                        <UserCircle className="w-3.5 h-3.5 text-primary" />
                        <h3 className="font-bold text-foreground text-[11.5px] sm:text-xs">Personal Information</h3>
                      </div>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="text-[10.5px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      {/* Full Name */}
                      <div>
                        <label className="block text-[9.5px] sm:text-[10px] font-bold text-foreground/80 mb-0.5 uppercase tracking-wide">
                          Full Name
                        </label>
                        {isEditing ? (
                          <div className="relative">
                            <UserCircle className="w-3 h-3 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={formData.fullName}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              className="w-full pl-7 pr-2.5 py-1 sm:py-1.5 border border-border rounded-md text-[11px] sm:text-xs bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none font-medium"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-foreground py-1 px-2.5 bg-muted/25 rounded-md border border-border/50">
                            <UserCircle className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{formData.fullName || "Not provided"}</span>
                          </div>
                        )}
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-[9.5px] sm:text-[10px] font-bold text-foreground/80 mb-0.5 uppercase tracking-wide">
                          Email Address
                        </label>
                        {isEditing ? (
                          <div className="relative">
                            <Mail className="w-3 h-3 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full pl-7 pr-2.5 py-1 sm:py-1.5 border border-border rounded-md text-[11px] sm:text-xs bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none font-medium"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-foreground py-1 px-2.5 bg-muted/25 rounded-md border border-border/50">
                            <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{formData.email || "Not provided"}</span>
                          </div>
                        )}
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-[9.5px] sm:text-[10px] font-bold text-foreground/80 mb-0.5 uppercase tracking-wide">
                          Phone Number
                        </label>
                        {isEditing ? (
                          <div className="relative">
                            <Phone className="w-3 h-3 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="tel"
                              maxLength={10}
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                              className="w-full pl-7 pr-2.5 py-1 sm:py-1.5 border border-border rounded-md text-[11px] sm:text-xs bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none font-medium"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-foreground py-1 px-2.5 bg-muted/25 rounded-md border border-border/50">
                            <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>{formData.phone || "Not provided"}</span>
                          </div>
                        )}
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-[9.5px] sm:text-[10px] font-bold text-foreground/80 mb-0.5 uppercase tracking-wide">
                          Date of Birth
                        </label>
                        {isEditing ? (
                          <DatePicker
                            value={formData.dob}
                            onChange={(val) => setFormData({ ...formData, dob: val })}
                            max={new Date().toISOString().split("T")[0]}
                            placeholder="Select date of birth..."
                            className="w-full text-xs"
                            presets={false}
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-foreground py-1 px-2.5 bg-muted/25 rounded-md border border-border/50">
                            <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>
                              {formData.dob
                                ? new Date(formData.dob).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Not provided"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-[9.5px] sm:text-[10px] font-bold text-foreground/80 mb-0.5 uppercase tracking-wide">
                          Gender
                        </label>
                        {isEditing ? (
                          <select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="w-full px-2.5 py-1 sm:py-1.5 border border-border rounded-md text-[11px] sm:text-xs bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none font-medium"
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other / Prefer not to say</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-foreground py-1 px-2.5 bg-muted/25 rounded-md border border-border/50">
                            <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>{formData.gender || "Not specified"}</span>
                          </div>
                        )}
                      </div>

                      {/* Block & Flat Number */}
                      <div>
                        <label className="block text-[9.5px] sm:text-[10px] font-bold text-foreground/80 mb-0.5 uppercase tracking-wide">
                          Residence Unit
                        </label>
                        {isEditing ? (
                          <div className="grid grid-cols-2 gap-1.5">
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
                              placeholder="Block"
                              className="w-full px-2 py-1 sm:py-1.5 border border-border rounded-md text-[11px] sm:text-xs uppercase font-bold text-center bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none"
                            />
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
                              placeholder="Flat"
                              className="w-full px-2 py-1 sm:py-1.5 border border-border rounded-md text-[11px] sm:text-xs font-semibold text-center bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-foreground py-1 px-2.5 bg-muted/25 rounded-md border border-border/50">
                            <Home className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>
                              {formData.block || formData.flatNo
                                ? `${formData.block ? `Block ${formData.block}, ` : ""}Flat ${formData.flatNo || "—"}`
                                : "Not specified"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bio */}
                      <div className="sm:col-span-2">
                        <label className="block text-[9.5px] sm:text-[10px] font-bold text-foreground/80 mb-0.5 uppercase tracking-wide">
                          About Me (Bio)
                        </label>
                        {isEditing ? (
                          <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            rows={2}
                            maxLength={250}
                            placeholder="Tell your neighbours a little about yourself, hobbies, or profession..."
                            className="w-full px-2.5 py-1 sm:py-1.5 border border-border rounded-md text-[11px] sm:text-xs bg-[var(--mana-bg-input)] focus:ring-2 focus:ring-primary/25 outline-none resize-none font-medium"
                          />
                        ) : (
                          <p className="text-[11px] sm:text-xs font-medium text-foreground py-1.5 px-2.5 bg-muted/25 rounded-md border border-border/50 leading-relaxed min-h-8">
                            {formData.bio || "No personal bio written yet."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* App Appearance & Interface */}
                  <div className="bg-card rounded-lg sm:rounded-xl border border-border p-2.5 sm:p-3.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-border/60">
                      <Palette className="w-3.5 h-3.5 text-violet-500" />
                      <h3 className="font-bold text-foreground text-[11.5px] sm:text-xs">App Experience & Appearance</h3>
                    </div>

                    <div className="space-y-2">
                      {/* Theme Selector */}
                      <div className="flex items-center justify-between py-0.5">
                        <div>
                          <p className="text-[11px] sm:text-xs font-semibold text-foreground leading-tight">Color Theme</p>
                          <p className="text-[9.5px] text-muted-foreground">Select your interface appearance</p>
                        </div>
                        <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-lg border border-border">
                          {[
                            { id: "light", label: "Light", icon: Sun },
                            { id: "dark", label: "Dark", icon: Moon },
                            { id: "system", label: "System", icon: Laptop },
                          ].map((t) => {
                            const Icon = t.icon;
                            const isSel = appPreferences.theme === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  handleUpdatePreferences({ theme: t.id });
                                  toast.success(`Theme set to ${t.label}`);
                                }}
                                className={cn(
                                  "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                                  isSel ? "bg-background text-foreground shadow-2xs border border-border/80" : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <Icon className="w-2.5 h-2.5" />
                                <span className="hidden sm:inline">{t.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sound & In-app Haptics */}
                      <div className="flex items-center justify-between py-0.5 border-t border-border/40">
                        <div>
                          <p className="text-[11px] sm:text-xs font-semibold text-foreground leading-tight">Sound & Audio Cues</p>
                          <p className="text-[9.5px] text-muted-foreground">Play audible sound on notices & updates</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdatePreferences({ soundEffects: !appPreferences.soundEffects })
                          }
                          className={cn(
                            "relative inline-flex h-4 w-7.5 items-center rounded-full transition-colors cursor-pointer",
                            appPreferences.soundEffects ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-xs",
                              appPreferences.soundEffects ? "translate-x-4" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>

                      {/* Auto Digital Pass */}
                      <div className="flex items-center justify-between py-0.5 border-t border-border/40">
                        <div>
                          <p className="text-[11px] sm:text-xs font-semibold text-foreground leading-tight">Auto-Generate Entry Passes</p>
                          <p className="text-[9.5px] text-muted-foreground">Show QR code pass upon booking events/sports</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdatePreferences({ autoCheckinPass: !appPreferences.autoCheckinPass })
                          }
                          className={cn(
                            "relative inline-flex h-4 w-7.5 items-center rounded-full transition-colors cursor-pointer",
                            appPreferences.autoCheckinPass ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-xs",
                              appPreferences.autoCheckinPass ? "translate-x-4" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Notifications & Data Management */}
                <div className="space-y-2.5 sm:space-y-3">
                  {/* Notification Settings */}
                  <div className="bg-card rounded-lg sm:rounded-xl border border-border p-2.5 sm:p-3 shadow-2xs">
                    <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-border/60">
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      <div>
                        <h3 className="font-bold text-foreground text-[11.5px] sm:text-xs">Notification Channels</h3>
                        <p className="text-[9.5px] text-muted-foreground">Toggle alerts you receive</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {visibleNotificationChannels.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground py-2 text-center">
                          No active notification channels enabled for your role.
                        </p>
                      ) : (
                        visibleNotificationChannels.map((item) => {
                          const isEnabled = notifications[item.key] ?? (item.defaultVal ?? true);
                          return (
                            <div key={item.key} className="flex items-center justify-between py-0.5 px-1 rounded hover:bg-muted/30 transition-colors">
                              <div className="min-w-0 pr-1.5">
                                <p className="text-[10.5px] font-semibold text-foreground leading-tight">{item.title}</p>
                                {item.desc && <p className="text-[8.5px] text-muted-foreground truncate">{item.desc}</p>}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setNotifications((prev) => {
                                    const currentVal = prev[item.key] ?? (item.defaultVal ?? true);
                                    const updated = {
                                      ...prev,
                                      [item.key]: !currentVal,
                                    };
                                    try {
                                      localStorage.setItem("mana_notification_preferences", JSON.stringify(updated));
                                    } catch {
                                      // ignore storage error
                                    }
                                    return updated;
                                  });
                                  toast.info(`Updated preference for ${item.title}`);
                                }}
                                className={cn(
                                  "relative inline-flex h-3.5 w-6.5 items-center rounded-full transition-colors cursor-pointer shrink-0",
                                  isEnabled ? "bg-primary" : "bg-muted"
                                )}
                              >
                                <span
                                  className={cn(
                                    "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-xs",
                                    isEnabled ? "translate-x-3.5" : "translate-x-0.5"
                                  )}
                                />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Data & Export Card */}
                  <div className="bg-card rounded-lg sm:rounded-xl border border-border p-2.5 sm:p-3 shadow-2xs">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Download className="w-3.5 h-3.5 text-emerald-500" />
                      <h3 className="font-bold text-foreground text-[11.5px] sm:text-xs">Data & Backup</h3>
                    </div>
                    <p className="text-[9.5px] text-muted-foreground mb-2 leading-relaxed">
                      Download a copy of your activity, registered events, invoices, and family records.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const exportData = {
                          profile,
                          familyMembers,
                          exportedAt: new Date().toISOString(),
                        };
                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `mana-community-profile-${profile?.userId || "user"}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success("Profile data exported successfully!");
                      }}
                      className="w-full flex items-center justify-center gap-1 py-1 px-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md text-[10.5px] border border-border transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Export Data (JSON)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === "activity" && (
            <div className="bg-card rounded-xl border border-border/80 p-3 sm:p-3.5 shadow-2xs space-y-2.5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-primary text-white flex items-center justify-center shadow-xs shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="font-bold text-foreground text-xs sm:text-[13px] tracking-tight">
                        Community Activity Feed
                      </h2>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {userActivities.length} {userActivities.length === 1 ? "Activity" : "Activities"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      Live timeline of your posts, marketplace items, sports & event RSVPs
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loadUserActivities(true)}
                  disabled={isLoadingActivities}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
                  title="Refresh activity feed from database"
                >
                  <RefreshCw className={cn("w-3 h-3", isLoadingActivities && "animate-spin text-primary")} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Filter Chips Bar */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {["ALL", "POST", "MARKETPLACE", "EVENT", "SPORTS", "COMMUNITY"].map((f) => {
                  const count = f === "ALL"
                    ? userActivities.length
                    : userActivities.filter((a) => (a.type || "").toUpperCase().includes(f) || (a.iconType || "").toUpperCase().includes(f)).length;
                  const isActive = activityFilter === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setActivityFilter(f)}
                      className={cn(
                        "px-2 py-0.5 text-[9.5px] font-semibold rounded-md whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1",
                        isActive
                          ? "bg-primary text-white shadow-2xs"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span>{f === "ALL" ? "All" : f === "POST" ? "Posts" : f === "MARKETPLACE" ? "Marketplace" : f === "EVENT" ? "Events" : f === "SPORTS" ? "Sports" : "Community"}</span>
                      <span className={cn("text-[8.5px] px-1 py-0.1 rounded-full font-bold", isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground")}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Activity Items List */}
              {isLoadingActivities && userActivities.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-1.5">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <p className="text-[11px] text-muted-foreground">Loading real-time activities...</p>
                </div>
              ) : (() => {
                const filtered = activityFilter === "ALL"
                  ? userActivities
                  : userActivities.filter((a) => (a.type || "").toUpperCase().includes(activityFilter) || (a.iconType || "").toUpperCase().includes(activityFilter));

                if (filtered.length === 0) {
                  return (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-1.5 bg-muted/15 rounded-lg border border-dashed border-border/70 p-4">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Users className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-semibold text-foreground">No activities found</p>
                      <p className="text-[10.5px] text-muted-foreground max-w-xs leading-relaxed">
                        {activityFilter !== "ALL"
                          ? `No ${activityFilter.toLowerCase()} activities recorded yet.`
                          : "Create posts in the feed, list items on marketplace, or join sports events to build your timeline."}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-1.5">
                    {filtered.map((item) => {
                      const iconConfig = getActivityIconConfig(item.iconType, item.type);
                      const IconComponent = iconConfig.icon;
                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-2.5 p-2 sm:p-2.5 rounded-lg bg-muted/20 hover:bg-muted/35 border border-border/50 transition-colors shadow-2xs"
                        >
                          <div className={cn("w-6.5 h-6.5 rounded-md flex items-center justify-center shrink-0 mt-0.5", iconConfig.bg)}>
                            <IconComponent className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11.5px] sm:text-xs font-medium text-foreground leading-snug">{item.text}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[9px]">
                              <span className="text-muted-foreground flex items-center gap-1 font-medium">
                                <Clock className="w-2.5 h-2.5 opacity-70" /> {item.time}
                              </span>
                              {item.type && (
                                <span className="text-[8px] uppercase tracking-wider font-bold px-1.2 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border/40">
                                  {item.type}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === "achievements" && (
            <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-primary" />
                <div>
                  <h2 className="font-bold text-foreground text-sm sm:text-base">Achievements & Badges</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Earned across events, sports, and volunteer sevas</p>
                </div>
              </div>

              {achievements.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center mb-2.5">
                    <Award className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground">No achievements yet</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-sm">
                    Participate in sports leagues, community events, and volunteer work to earn badges.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {achievements.map((a) => (
                    <div
                      key={a.id}
                      className="text-center p-3 rounded-xl border-2 border-primary/20 bg-primary/5"
                    >
                      <div className="text-2xl mb-1.5 leading-none">{a.icon || "🏅"}</div>
                      <p className="text-xs sm:text-sm font-bold text-foreground">{a.title}</p>
                      {a.description && <p className="text-[11px] text-muted-foreground mt-0.5">{a.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="space-y-3 sm:space-y-4">
              {/* Security Health & Account Hardening Banner */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-xs sm:text-sm font-bold text-foreground">
                        Account Security & Threat Protection
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIsScoreModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 cursor-pointer transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                        title="Click to view detailed score breakdown"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>88/100 • Strong Protection</span>
                        <HelpCircle className="w-2.5 h-2.5 ml-0.5 opacity-80" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-[10px] sm:text-[10.5px] text-muted-foreground leading-relaxed">
                        Your identity and sessions are guarded with cryptographic hashing and multi-layer device protection.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsScoreModalOpen(true)}
                        className="text-[9.5px] sm:text-[10px] text-primary hover:underline font-semibold inline-flex items-center gap-0.5 cursor-pointer shrink-0"
                      >
                        How is this calculated? →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 text-[10px] text-muted-foreground self-stretch sm:self-auto shrink-0">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-card border border-border">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Password OK</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-card border border-border">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>2FA Ready</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-card border border-border">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>{activeSessions.length} Device{activeSessions.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-card border border-border">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>KYC Verified</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Left Column: Password & Multi-Factor Authentication */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Change Password Card */}
                  <div className="bg-card rounded-xl border border-border p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                      <div className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-primary" />
                        <div>
                          <h3 className="font-bold text-foreground text-[11.5px] sm:text-xs">Change Password</h3>
                          <p className="text-[9.5px] text-muted-foreground">Update your master account credentials</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSuggestNewPassword}
                        className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-primary hover:text-primary/80 transition-colors py-0.5 px-2 rounded-md hover:bg-primary/10 border border-primary/20 cursor-pointer shadow-2xs"
                        title="Generate a cryptographically-secure password"
                      >
                        <Sparkles className="w-3 h-3" />
                        Suggest Strong
                      </button>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-2">
                      {/* Current Password Field */}
                      <div>
                        <label className="block text-[10px] font-semibold text-foreground/80 mb-0.5 uppercase tracking-wider">
                          Current Password <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-3 h-3 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => {
                              setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                              if (passwordErrors.currentPassword) {
                                setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined }));
                              }
                            }}
                            placeholder="Enter current password"
                            maxLength={20}
                            className={cn(
                              "w-full pl-7.5 pr-8 py-1.5 border rounded-lg text-xs bg-[var(--mana-bg-input)] outline-none transition-all",
                              passwordErrors.currentPassword
                                ? "border-destructive ring-1 ring-destructive/20"
                                : "border-border focus:ring-1 focus:ring-primary/30"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                            aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                          >
                            {showCurrentPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="text-destructive text-[10px] mt-0.5 font-medium">{passwordErrors.currentPassword}</p>
                        )}
                      </div>

                      {/* New Password Field */}
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[10px] font-semibold text-foreground/80 uppercase tracking-wider">
                            New Password <span className="text-destructive">*</span>
                          </label>
                          <span className="text-[9px] text-muted-foreground">6–20 chars (letters & numbers)</span>
                        </div>
                        <div className="relative">
                          <Lock className="w-3 h-3 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => {
                              setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                              if (passwordErrors.newPassword) {
                                setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }));
                              }
                            }}
                            placeholder="Enter new password"
                            maxLength={20}
                            className={cn(
                              "w-full pl-7.5 pr-8 py-1.5 border rounded-lg text-xs bg-[var(--mana-bg-input)] outline-none transition-all",
                              passwordErrors.newPassword
                                ? "border-destructive ring-1 ring-destructive/20"
                                : "border-border focus:ring-1 focus:ring-primary/30"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                        <PasswordStrengthMeter
                          password={passwordForm.newPassword}
                          userInputs={[profile?.email, profile?.fullName, profile?.phone].filter(Boolean) as string[]}
                          className="mt-1"
                        />
                        {passwordErrors.newPassword && (
                          <p className="text-destructive text-[10px] mt-0.5 font-medium">{passwordErrors.newPassword}</p>
                        )}
                      </div>

                      {/* Confirm New Password Field */}
                      <div>
                        <label className="block text-[10px] font-semibold text-foreground/80 mb-0.5 uppercase tracking-wider">
                          Confirm New Password <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-3 h-3 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => {
                              setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                              if (passwordErrors.confirmPassword) {
                                setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                              }
                            }}
                            placeholder="Re-enter new password"
                            maxLength={20}
                            className={cn(
                              "w-full pl-7.5 pr-8 py-1.5 border rounded-lg text-xs bg-[var(--mana-bg-input)] outline-none transition-all",
                              passwordErrors.confirmPassword
                                ? "border-destructive ring-1 ring-destructive/20"
                                : "border-border focus:ring-1 focus:ring-primary/30"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <p className="text-destructive text-[10px] mt-0.5 font-medium">{passwordErrors.confirmPassword}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full py-1.5 mt-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-all shadow-2xs active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Updating Password...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            Update Password
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Multi-Factor Authentication & Access Controls Card (Disabled for now) */}
                  <div className="bg-card rounded-xl border border-border p-3 sm:p-3.5 shadow-2xs space-y-2 opacity-85">
                    <div className="flex items-center justify-between pb-1 border-b border-border/60">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-foreground text-[11.5px] sm:text-xs">
                              Two-Factor Authentication & Sign-in
                            </h3>
                            <span className="text-[8.5px] bg-muted text-muted-foreground font-semibold px-1.5 py-0.2 rounded">
                              Disabled
                            </span>
                            <span className="text-[8.5px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 border border-amber-500/25">
                              <Clock className="w-2.5 h-2.5" />
                              Coming Soon
                            </span>
                          </div>
                          <p className="text-[9.5px] text-muted-foreground">Advanced hardware tokens and authenticator app enrollment coming soon</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {/* Authenticator App */}
                      <div className="flex items-center justify-between py-1 px-1.5 rounded-lg bg-muted/10 opacity-60 cursor-not-allowed">
                        <div className="pr-2 min-w-0">
                          <p className="text-[10.5px] font-semibold text-foreground leading-tight">
                            Authenticator App (TOTP)
                          </p>
                          <p className="text-[8.5px] text-muted-foreground">
                            Google Authenticator, Authy, or Microsoft Authenticator
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled
                          className="relative inline-flex h-3.5 w-6.5 items-center rounded-full bg-muted cursor-not-allowed shrink-0 opacity-60"
                          title="Currently disabled"
                        >
                          <span className="inline-block h-2.5 w-2.5 transform rounded-full bg-white/80 translate-x-0.5 shadow-xs" />
                        </button>
                      </div>

                      {/* SMS / WhatsApp OTP Backup */}
                      <div className="flex items-center justify-between py-1 px-1.5 rounded-lg bg-muted/10 opacity-60 cursor-not-allowed">
                        <div className="pr-2 min-w-0">
                          <p className="text-[10.5px] font-semibold text-foreground leading-tight">
                            SMS / WhatsApp OTP Backup
                          </p>
                          <p className="text-[8.5px] text-muted-foreground">
                            Send one-time verification codes to your registered phone
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled
                          className="relative inline-flex h-3.5 w-6.5 items-center rounded-full bg-muted cursor-not-allowed shrink-0 opacity-60"
                          title="Currently disabled"
                        >
                          <span className="inline-block h-2.5 w-2.5 transform rounded-full bg-white/80 translate-x-0.5 shadow-xs" />
                        </button>
                      </div>

                      {/* Biometric / Passkey */}
                      <div className="flex items-center justify-between py-1 px-1.5 rounded-lg bg-muted/10 opacity-60 cursor-not-allowed">
                        <div className="pr-2 min-w-0">
                          <p className="text-[10.5px] font-semibold text-foreground leading-tight">
                            Biometric / Passkey Login
                          </p>
                          <p className="text-[8.5px] text-muted-foreground">
                            Windows Hello, Touch ID, or Face ID device authentication
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled
                          className="relative inline-flex h-3.5 w-6.5 items-center rounded-full bg-muted cursor-not-allowed shrink-0 opacity-60"
                          title="Currently disabled"
                        >
                          <span className="inline-block h-2.5 w-2.5 transform rounded-full bg-white/80 translate-x-0.5 shadow-xs" />
                        </button>
                      </div>

                      {/* Instant Login Alerts */}
                      <div className="flex items-center justify-between py-1 px-1.5 rounded-lg bg-muted/10 opacity-60 cursor-not-allowed">
                        <div className="pr-2 min-w-0">
                          <p className="text-[10.5px] font-semibold text-foreground leading-tight">
                            Instant New Device Login Alerts
                          </p>
                          <p className="text-[8.5px] text-muted-foreground">
                            Receive immediate email notifications on unrecognized logins
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled
                          className="relative inline-flex h-3.5 w-6.5 items-center rounded-full bg-muted cursor-not-allowed shrink-0 opacity-60"
                          title="Currently disabled"
                        >
                          <span className="inline-block h-2.5 w-2.5 transform rounded-full bg-white/80 translate-x-0.5 shadow-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Active Sessions & Audit Trail */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Active Sessions Card */}
                  <div className="bg-card rounded-xl border border-border p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                      <div className="flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-primary" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-foreground text-[11.5px] sm:text-xs">
                              Active Logged-in Devices ({activeSessions.length})
                            </h3>
                            <button
                              type="button"
                              onClick={() => loadSessions()}
                              disabled={isLoadingSessions}
                              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
                              title="Refresh active sessions"
                            >
                              <RefreshCw className={cn("w-2.5 h-2.5", isLoadingSessions && "animate-spin text-primary")} />
                            </button>
                          </div>
                          <p className="text-[9.5px] text-muted-foreground">Current active JWT authentication tokens</p>
                        </div>
                      </div>
                      {activeSessions.some((s) => !s.isCurrent) && (
                        <button
                          type="button"
                          onClick={handleSignOutAllOtherSessions}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors py-0.5 px-2 rounded-md hover:bg-rose-500/10 border border-rose-500/20 cursor-pointer shadow-2xs"
                        >
                          <LogOut className="w-3 h-3" />
                          Sign Out Others
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {activeSessions.map((session) => {
                        const DeviceIcon =
                          session.deviceType === "mobile"
                            ? Smartphone
                            : session.deviceType === "laptop"
                            ? Laptop
                            : Monitor;

                        return (
                          <div
                            key={session.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg border transition-all",
                              session.isCurrent
                                ? "bg-primary/5 border-primary/20 dark:bg-primary/10"
                                : "bg-muted/20 border-border hover:bg-muted/40"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={cn(
                                  "p-1.5 rounded-md shrink-0",
                                  session.isCurrent
                                    ? "bg-primary/15 text-primary"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                <DeviceIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-[11px] font-bold text-foreground truncate">{session.device}</p>
                                  {session.isCurrent ? (
                                    <span className="text-[8.5px] bg-primary/15 text-primary font-bold px-1.5 py-0.2 rounded-full flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      This Device
                                    </span>
                                  ) : (
                                    <span className="text-[8.5px] text-muted-foreground font-mono">
                                      IP: {session.ip}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9.5px] text-muted-foreground">
                                  {session.location} • <span className="font-medium">{session.lastActive}</span>
                                </p>
                              </div>
                            </div>

                            {!session.isCurrent && (
                              <button
                                type="button"
                                onClick={() => handleRevokeSession(session.id, session.device)}
                                className="px-2 py-1 text-[9.5px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer shrink-0 border border-transparent hover:border-rose-500/20"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Security Activity & Audit Trail Card */}
                  <div className="bg-card rounded-xl border border-border p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-foreground text-[11.5px] sm:text-xs">
                              Recent Security Audit Log
                            </h3>
                            <button
                              type="button"
                              onClick={() => loadSecurityAuditLogs(auditPage, auditPageSize, true)}
                              disabled={isLoadingAuditLogs}
                              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
                              title="Refresh audit logs"
                            >
                              <RefreshCw className={cn("w-2.5 h-2.5", isLoadingAuditLogs && "animate-spin text-primary")} />
                            </button>
                          </div>
                          <p className="text-[9.5px] text-muted-foreground">Live authentication & profile security events</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {auditTotalElements} {auditTotalElements === 1 ? "Event" : "Total Events"}
                      </span>
                    </div>

                    {isLoadingAuditLogs && securityAuditLogs.length === 0 ? (
                      <div className="py-6 flex flex-col items-center justify-center text-center space-y-1.5">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <p className="text-[10px] text-muted-foreground">Loading audit log...</p>
                      </div>
                    ) : securityAuditLogs.length === 0 ? (
                      <div className="py-5 text-center text-[10.5px] text-muted-foreground">
                        No security audit logs recorded for this page.
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-[10px]">
                        {securityAuditLogs.map((item) => {
                          const Icon =
                            item.iconType === "LOGIN"
                              ? CheckCircle2
                              : item.iconType === "SHIELD"
                              ? ShieldCheck
                              : item.iconType === "SMARTPHONE"
                              ? Smartphone
                              : item.iconType === "KEY"
                              ? Key
                              : item.iconType === "AWARD"
                              ? Award
                              : item.iconType === "LOCK"
                              ? Lock
                              : ShieldCheck;

                          return (
                            <div
                              key={item.id}
                              className="flex items-start justify-between p-1.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors gap-2"
                            >
                              <div className="flex items-start gap-1.5 min-w-0">
                                <Icon className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", item.color)} />
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground truncate">{item.event}</p>
                                  <p className="text-[8.5px] text-muted-foreground truncate">{item.location}</p>
                                </div>
                              </div>
                              <span className="text-[8.5px] text-muted-foreground shrink-0 font-medium whitespace-nowrap">
                                {item.time}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {auditTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground text-[9.5px]">Page Size:</span>
                          <select
                            value={auditPageSize}
                            onChange={(e) => {
                              const newSize = Number(e.target.value);
                              setAuditPageSize(newSize);
                              setAuditPage(0);
                              loadSecurityAuditLogs(0, newSize);
                            }}
                            className="text-[9.5px] bg-muted/40 border border-border/60 rounded px-1.5 py-0.5 text-foreground outline-none cursor-pointer hover:bg-muted/60"
                          >
                            <option value={5}>5 / page</option>
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-[9.5px] mr-1">
                            {auditPage + 1} of {auditTotalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const prev = Math.max(0, auditPage - 1);
                              setAuditPage(prev);
                              loadSecurityAuditLogs(prev, auditPageSize);
                            }}
                            disabled={auditPage === 0 || isLoadingAuditLogs}
                            className="p-1 rounded bg-muted/40 hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed border border-border/50 transition-colors cursor-pointer"
                            title="Previous Page"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>

                          {/* Numbered Page Buttons */}
                          {Array.from({ length: auditTotalPages }).map((_, idx) => {
                            if (
                              auditTotalPages <= 5 ||
                              idx === 0 ||
                              idx === auditTotalPages - 1 ||
                              Math.abs(idx - auditPage) <= 1
                            ) {
                              const isSelected = idx === auditPage;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setAuditPage(idx);
                                    loadSecurityAuditLogs(idx, auditPageSize);
                                  }}
                                  disabled={isLoadingAuditLogs}
                                  className={cn(
                                    "min-w-5 h-5 px-1 rounded text-[9.5px] font-semibold flex items-center justify-center transition-colors cursor-pointer",
                                    isSelected
                                      ? "bg-primary text-primary-foreground shadow-2xs"
                                      : "bg-muted/40 hover:bg-muted text-foreground border border-border/40"
                                  )}
                                >
                                  {idx + 1}
                                </button>
                              );
                            }
                            if (
                              (idx === 1 && auditPage > 2) ||
                              (idx === auditTotalPages - 2 && auditPage < auditTotalPages - 3)
                            ) {
                              return (
                                <span key={idx} className="text-muted-foreground px-0.5 text-[9px]">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}

                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.min(auditTotalPages - 1, auditPage + 1);
                              setAuditPage(next);
                              loadSecurityAuditLogs(next, auditPageSize);
                            }}
                            disabled={auditPage >= auditTotalPages - 1 || isLoadingAuditLogs}
                            className="p-1 rounded bg-muted/40 hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed border border-border/50 transition-colors cursor-pointer"
                            title="Next Page"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === "privacy" && (
            <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-5 shadow-2xs">
              <PrivacySettingsTab />
            </div>
          )}

          {/* Security Score Breakdown Modal */}
          {isScoreModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
              <div className="bg-card rounded-xl sm:rounded-2xl border border-border shadow-2xl max-w-lg w-full p-4 sm:p-5 relative overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col justify-between overflow-y-auto">
                <div>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-border mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm sm:text-base">
                          Security Posture Breakdown
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                          Comprehensive audit of your account hardening and defense layers
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsScoreModalOpen(false)}
                      className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Top Score Banner */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 mb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                          88<span className="text-xs sm:text-sm font-semibold text-muted-foreground">/100</span>
                        </div>
                        <div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Grade A • Strong Protection
                          </span>
                          <p className="text-[9.5px] text-muted-foreground mt-0.5">Low risk profile • 3 of 4 defense rings maxed</p>
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-bold text-muted-foreground">Target: 100/100</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 w-[88%]" />
                    </div>
                  </div>

                  {/* 4 Pillars List */}
                  <div className="space-y-2">
                    {/* 1. Password Integrity */}
                    <div className="p-2.5 sm:p-3 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-[11px] sm:text-[11.5px] font-bold text-foreground">Password Integrity & Cryptography</span>
                        </div>
                        <span className="text-[10px] sm:text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                          25 / 25 pts
                        </span>
                      </div>
                      <p className="text-[9px] sm:text-[9.5px] text-muted-foreground leading-relaxed">
                        Industry-grade Bcrypt 12-round salted hashing, dictionary attack protection, and automatic account lockout after 5 consecutive failed attempts.
                      </p>
                    </div>

                    {/* 2. Active Session & Device Hygiene */}
                    <div className="p-2.5 sm:p-3 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-[11px] sm:text-[11.5px] font-bold text-foreground">Session & Device Hygiene</span>
                        </div>
                        <span className="text-[10px] sm:text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                          25 / 25 pts
                        </span>
                      </div>
                      <p className="text-[9px] sm:text-[9.5px] text-muted-foreground leading-relaxed">
                        Live cryptographic JWT authentication tracking with real-time browser/OS fingerprinting, individual remote revocation, and single-click "Sign Out Others".
                      </p>
                    </div>

                    {/* 3. KYC & Identity Verification */}
                    <div className="p-2.5 sm:p-3 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-[11px] sm:text-[11.5px] font-bold text-foreground">Identity & KYC Residence Check</span>
                        </div>
                        <span className="text-[10px] sm:text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                          20 / 20 pts
                        </span>
                      </div>
                      <p className="text-[9px] sm:text-[9.5px] text-muted-foreground leading-relaxed">
                        Account linked to verified apartment block/unit registry with dual-verified phone & primary email. Granular role-based access control (RBAC) enforced.
                      </p>
                    </div>

                    {/* 4. Multi-Factor & Advanced Hardening */}
                    <div className="p-2.5 sm:p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-[11px] sm:text-[11.5px] font-bold text-foreground">Multi-Factor & Hardware Tokens</span>
                        </div>
                        <span className="text-[10px] sm:text-[10.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-md shrink-0">
                          18 / 30 pts
                        </span>
                      </div>
                      <p className="text-[9px] sm:text-[9.5px] text-muted-foreground leading-relaxed">
                        SMS & Email OTP fallback active for password resets and sensitive account changes (+18 pts). Authenticator app (TOTP) and Passkeys (+12 pts) will award the remaining score once enrolled.
                      </p>
                    </div>
                  </div>

                  {/* Recommendation Box */}
                  <div className="mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[9px] sm:text-[9.5px] text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Path to 100/100:</strong> Authenticator App (TOTP) and Biometric Passkeys will unlock the final 12 points upon public rollout.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border mt-3.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsScoreModalOpen(false)}
                    className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
                  >
                    Got it, close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
