import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { profileService } from "../../../services/profileService";
import type { UserProfileResponse } from "../../../types/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = "overview" | "activity" | "achievements" | "settings" | "security";

const defaultAvatar = "https://images.unsplash.com/photo-1707396172424-f3293f788364?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwcm9maWxlJTIwYXZhdGFyJTIwcGVyc29ufGVufDF8fHx8MTc3NzA1ODgxOXww&ixlib=rb-4.1.0&q=80&w=1080";
const defaultCover = "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200&q=80";

const activityFeed = [
  { id: 1, type: "post", text: "Posted in Community Feed: 'Reminder: Society AGM this Sunday at 5PM'", time: "2 hours ago", icon: Users, color: "indigo" },
  { id: 2, type: "marketplace", text: "Listed '4-seater dining table' on Marketplace for ₹8,500", time: "1 day ago", icon: Package, color: "emerald" },
  { id: 3, type: "event", text: "Registered for 'Annual Sports Day 2026'", time: "2 days ago", icon: Trophy, color: "yellow" },
  { id: 4, type: "job", text: "Referred a candidate for 'Senior React Developer' at TechCorp", time: "3 days ago", icon: Briefcase, color: "purple" },
  { id: 5, type: "sports", text: "Scored 42 runs in Cricket Tournament – Tower A vs Tower B", time: "5 days ago", icon: Trophy, color: "orange" },
  { id: 6, type: "post", text: "Posted in Community Feed: 'Lost & Found: Black umbrella near pool area'", time: "1 week ago", icon: Users, color: "indigo" },
];

const sessions = [
  { id: 1, device: "Chrome on MacOS", location: "Bangalore, IN", lastActive: "Active now", isCurrent: true },
  { id: 2, device: "Mobile App - iOS", location: "Bangalore, IN", lastActive: "2 hours ago", isCurrent: false },
  { id: 3, device: "Firefox on Windows", location: "Hyderabad, IN", lastActive: "3 days ago", isCurrent: false },
];

export function ProfileDashboard() {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "Male",
    address: "",
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

  useEffect(() => {
    profileService.getProfile()
      .then(res => {
        setProfile(res);
        setFormData({
          fullName: res.fullName || "",
          email: res.email || "",
          phone: res.phone || "",
          dob: res.dob || "",
          gender: res.gender || "Male",
          address: (res.flatNo && res.block) ? `Flat ${res.flatNo}, Block ${res.block}` : (res.flatNo || res.block || ""),
          bio: res.bio || "",
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading user profile:", err);
        toast.error("Failed to load profile data.");
        setLoading(false);
      });
  }, []);

  const getRoleConfig = (roleStr?: string) => {
    const r = (roleStr || "MEMBER").toUpperCase();
    if (r === "SUPER_ADMIN" || r === "ADMIN" || r === "COMMUNITY_ADMIN" || r === "SPORTS_ADMIN") {
      return { label: "Admin", color: "bg-violet-50 text-violet-700 border border-violet-200", icon: Award };
    } else if (r === "VENDOR") {
      return { label: "Vendor", color: "bg-blue-50 text-blue-700 border border-blue-200", icon: ShieldCheck };
    }
    return { label: "Verified Member", color: "bg-green-50 text-green-700 border border-green-200", icon: ShieldCheck };
  };

  const handleSaveProfile = () => {
    if (!profile) return;

    let flatNo = formData.address;
    let block = "";
    if (formData.address.toLowerCase().includes("block")) {
      const parts = formData.address.split(/block/i);
      flatNo = parts[0].replace(/flat/i, "").replace(/,/g, "").trim();
      block = parts[1].trim();
    }

    profileService.updateProfile({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dob,
      gender: formData.gender,
      flatNo: flatNo,
      block: block,
      bio: formData.bio,
      skills: profile.skills,
      profilePicUrl: profile.profilePicUrl,
      coverPicUrl: profile.coverPicUrl,
    })
    .then(res => {
      setProfile(res);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    })
    .catch(err => {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile.");
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Simulate S3 upload with temporary Unsplash URL for display
    const placeholderUrl = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&q=80`;
    profileService.updateProfile({
      profilePicUrl: placeholderUrl,
    })
    .then(res => {
      setProfile(res);
      toast.success("Profile picture updated!");
    })
    .catch(err => {
      console.error(err);
      toast.error("Failed to update avatar.");
    });
  };


  const handleAddSkill = () => {
    if (!profile || !newSkill.trim()) return;
    const updatedSkills = [...profile.skills, newSkill.trim()];

    profileService.updateProfile({
      skills: updatedSkills,
    })
    .then(res => {
      setProfile(res);
      setNewSkill("");
      setShowAddSkillInput(false);
      toast.success("Skill added!");
    })
    .catch(err => {
      console.error(err);
      toast.error("Failed to add skill.");
    });
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!profile) return;
    const updatedSkills = profile.skills.filter(s => s !== skillToRemove);

    profileService.updateProfile({
      skills: updatedSkills,
    })
    .then(res => {
      setProfile(res);
      toast.success("Skill removed!");
    })
    .catch(err => {
      console.error(err);
      toast.error("Failed to remove skill.");
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Password changed successfully!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <p>Could not load user profile.</p>
      </div>
    );
  }

  const role = getRoleConfig(profile.role);
  const userAvatar = profile.profilePicUrl || defaultAvatar;
  const userCover = profile.coverPicUrl || defaultCover;

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
      <div className="bg-white border-b border-slate-200 px-6 sm:px-10 pt-22 pb-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-20 pb-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl ring-4 ring-indigo-100">
                <img src={userAvatar} alt={profile.fullName} className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-3 right-3 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-3 -right-3 bg-[#4f46e5] hover:bg-[#4338ca] text-white p-2.5 rounded-xl shadow-lg transition-all hover:scale-110 active:scale-95"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Name & Meta */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{profile.fullName}</h1>
                {profile.kycStatus === "VERIFIED" && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" /> KYC Verified
                  </span>
                )}
                <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest", role.color)}>
                  <role.icon className="w-3.5 h-3.5" /> {role.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  {profile.communityName || "No Community"}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  Bangalore, India
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Member since {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Nov 2025"}
                </span>
                <span className="flex items-center gap-1.5 text-xs bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
                  USR-{profile.userId.toString().padStart(4, "0")}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pb-2">
              <button
                onClick={() => {
                  if (activeTab !== "settings") {
                    setActiveTab("settings");
                  }
                  setIsEditing(!isEditing);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-300/40 hover:-translate-y-0.5"
              >
                <PenLine className="w-4 h-4" />
                {isEditing ? "Cancel Edit" : "Edit Profile"}
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all"
              >
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-8">
            {[
              { label: "Posts", value: profile.stats.posts, colorClass: "text-indigo-600", bgClass: "bg-indigo-50 border-indigo-100" },
              { label: "Network", value: profile.stats.connections, colorClass: "text-violet-600", bgClass: "bg-violet-50 border-violet-100" },
              { label: "Events", value: profile.stats.eventsAttended, colorClass: "text-rose-600", bgClass: "bg-rose-50 border-rose-100" },
              { label: "Items", value: profile.stats.itemsSold, colorClass: "text-emerald-600", bgClass: "bg-emerald-50 border-emerald-100" },
              { label: "Jobs", value: profile.stats.jobsPosted, colorClass: "text-blue-600", bgClass: "bg-blue-50 border-blue-100" },
              { label: "Sports", value: profile.stats.sportsPlayed, colorClass: "text-amber-600", bgClass: "bg-amber-50 border-amber-100" },
            ].map((stat) => (
              <div key={stat.label} className={cn("rounded-2xl p-4 text-center border", stat.bgClass)}>
                <div className={cn("text-2xl font-black", stat.colorClass)}>{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-0 -mb-px mt-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
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
                {/* About */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="font-semibold text-slate-900 mb-3">About</h2>
                  <p className="text-slate-600 text-sm leading-relaxed">{profile.bio || "No bio yet."}</p>
                  <div className="mt-4 space-y-2.5 text-sm">
                    {[
                      { icon: Mail, label: profile.email },
                      { icon: Phone, label: profile.phone },
                      { icon: MapPin, label: formData.address || "No Address Added" },
                      { icon: Calendar, label: profile.joinedAt ? `Joined ${new Date(profile.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : "Joined recently" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-slate-600">
                        <item.icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills & Interests */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="font-semibold text-slate-900 mb-3">Skills & Interests</h2>
                  <div className="flex flex-wrap gap-2 items-center">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full border border-indigo-100">
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-500 font-bold ml-1 text-xs"
                          title="Remove skill"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    
                    {showAddSkillInput ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newSkill}
                          placeholder="Skill name"
                          onChange={(e) => setNewSkill(e.target.value)}
                          className="px-2 py-1 text-sm border border-slate-300 rounded-lg outline-none w-28"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddSkill();
                            if (e.key === "Escape") setShowAddSkillInput(false);
                          }}
                        />
                        <button onClick={handleAddSkill} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded">Add</button>
                        <button onClick={() => setShowAddSkillInput(false)} className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddSkillInput(true)}
                        className="px-3 py-1 bg-slate-50 text-slate-500 text-sm rounded-full border border-dashed border-slate-300 hover:bg-slate-100 transition-colors"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>

                {/* Recent Activity Preview */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-slate-900">Recent Activity</h2>
                    <button onClick={() => setActiveTab("activity")} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5">
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {activityFeed.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          item.color === "indigo" ? "bg-indigo-100" :
                          item.color === "emerald" ? "bg-emerald-100" :
                          item.color === "yellow" ? "bg-yellow-100" :
                          item.color === "purple" ? "bg-purple-100" : "bg-orange-100"
                        )}>
                          <item.icon className={cn(
                            "w-4 h-4",
                            item.color === "indigo" ? "text-indigo-600" :
                            item.color === "emerald" ? "text-emerald-600" :
                            item.color === "yellow" ? "text-yellow-600" :
                            item.color === "purple" ? "text-purple-600" : "text-orange-600"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 leading-snug">{item.text}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* KYC Status Card */}
                <div className={cn(
                  "rounded-xl border p-5",
                  profile.kycStatus === "VERIFIED" ? "bg-green-50 border-green-200" :
                  profile.kycStatus === "PENDING" ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {profile.kycStatus === "VERIFIED" ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                     profile.kycStatus === "PENDING" ? <Clock className="w-5 h-5 text-yellow-600" /> :
                     <XCircle className="w-5 h-5 text-red-600" />}
                    <span className={cn(
                      "font-semibold text-sm",
                      profile.kycStatus === "VERIFIED" ? "text-green-800" :
                      profile.kycStatus === "PENDING" ? "text-yellow-800" : "text-red-800"
                    )}>
                      KYC {profile.kycStatus === "VERIFIED" ? "Verified" : profile.kycStatus === "PENDING" ? "Under Review" : "Rejected"}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs",
                    profile.kycStatus === "VERIFIED" ? "text-green-700" :
                    profile.kycStatus === "PENDING" ? "text-yellow-700" : "text-red-700"
                  )}>
                    {profile.kycStatus === "VERIFIED"
                      ? "Your identity has been verified. You have full access to all community features."
                      : profile.kycStatus === "PENDING"
                      ? "Your documents are being reviewed. You'll be notified once verified."
                      : "Your KYC was rejected. Please resubmit with valid documents."}
                  </p>
                </div>

                {/* Community Info */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h2 className="font-semibold text-slate-900 mb-3 text-sm">Community Membership</h2>
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{profile.communityName || "No Community"}</p>
                      <p className="text-xs text-slate-500">{profile.communityCode || "N/A"}</p>
                    </div>
                    {profile.communityName && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                      <p className="font-semibold text-slate-900">{profile.communityType || "N/A"}</p>
                      <p className="text-slate-500">Type</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                      <p className="font-semibold text-slate-900">{role.label}</p>
                      <p className="text-slate-500">Role</p>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h2 className="font-semibold text-slate-900 mb-3 text-sm">Quick Links</h2>
                  <div className="space-y-1">
                    {[
                      { icon: Package, label: "My Marketplace Listings", count: profile.stats.itemsSold },
                      { icon: Briefcase, label: "My Job Postings", count: profile.stats.jobsPosted },
                      { icon: Trophy, label: "My Sports Records", count: profile.stats.sportsPlayed },
                      { icon: Calendar, label: "My Events", count: profile.stats.eventsAttended },
                    ].map((link) => (
                      <button key={link.label} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <link.icon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{link.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{link.count}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === "activity" && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                <div className="px-6 py-4">
                  <h2 className="font-semibold text-slate-900">Activity History</h2>
                  <p className="text-sm text-slate-500 mt-0.5">All your interactions across the community platform</p>
                </div>
                <div className="p-6">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200"></div>
                    <div className="space-y-6">
                      {activityFeed.map((item) => (
                        <div key={item.id} className="relative flex items-start gap-4 pl-12">
                          <div className={cn(
                            "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-4 ring-white",
                            item.color === "indigo" ? "bg-indigo-100" :
                            item.color === "emerald" ? "bg-emerald-100" :
                            item.color === "yellow" ? "bg-yellow-100" :
                            item.color === "purple" ? "bg-purple-100" : "bg-orange-100"
                          )}>
                            <item.icon className={cn(
                              "w-4 h-4",
                              item.color === "indigo" ? "text-indigo-600" :
                              item.color === "emerald" ? "text-emerald-600" :
                              item.color === "yellow" ? "text-yellow-600" :
                              item.color === "purple" ? "text-purple-600" : "text-orange-600"
                            )} />
                          </div>
                          <div className="flex-1 bg-slate-50 rounded-xl p-4">
                            <p className="text-sm text-slate-800 leading-snug">{item.text}</p>
                            <p className="text-xs text-slate-400 mt-1.5">{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === "achievements" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Award className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="font-semibold text-slate-900">Achievements</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Badges earned across the community</p>
                </div>
              </div>

              {achievements.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                    <Award className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">No achievements yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Take part in sports, events and the community to start earning badges. They'll show up here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {achievements.map((a) => (
                    <div
                      key={a.id}
                      className="text-center p-4 rounded-xl border-2 border-indigo-100 bg-indigo-50/50"
                    >
                      <div className="text-3xl mb-2 leading-none">{a.icon || "🏅"}</div>
                      <p className="text-sm font-bold text-slate-900">{a.title}</p>
                      {a.description && <p className="text-xs text-slate-500 mt-1">{a.description}</p>}
                      {a.earnedAt && (
                        <p className="text-[10px] text-slate-400 mt-2">
                          {new Date(a.earnedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Info */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="font-semibold text-slate-900">Personal Information</h2>
                      <p className="text-sm text-slate-500 mt-0.5">Update your personal details</p>
                    </div>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <X className="w-4 h-4" /> Cancel
                        </button>
                        <button onClick={handleSaveProfile} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors">
                          <Save className="w-4 h-4" /> Save
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Full Name", key: "fullName", type: "text" },
                      { label: "Email Address", key: "email", type: "email" },
                      { label: "Phone Number", key: "phone", type: "tel" },
                      { label: "Date of Birth", key: "dob", type: "date" },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">{field.label}</label>
                        {isEditing ? (
                          <input
                            type={field.type}
                            value={formData[field.key as keyof typeof formData]}
                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                          />
                        ) : (
                          <p className="text-sm text-slate-900 py-2 px-3 bg-slate-50 rounded-lg">
                            {field.key === "dob" && formData.dob 
                              ? new Date(formData.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) 
                              : (formData[field.key as keyof typeof formData] || "Not provided")}
                          </p>
                        )}
                      </div>
                    ))}

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Gender</label>
                      {isEditing ? (
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          {["MALE", "FEMALE", "OTHER"].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      ) : (
                        <p className="text-sm text-slate-900 py-2 px-3 bg-slate-50 rounded-lg">{formData.gender}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Address</label>
                      {isEditing ? (
                        <textarea
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                      ) : (
                        <p className="text-sm text-slate-900 py-2 px-3 bg-slate-50 rounded-lg">{formData.address || "No address provided"}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Bio</label>
                      {isEditing ? (
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                          maxLength={250}
                        />
                      ) : (
                        <p className="text-sm text-slate-900 py-2 px-3 bg-slate-50 rounded-lg leading-relaxed">{formData.bio || "No bio yet."}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-slate-600" />
                    <h2 className="font-semibold text-slate-900">Notifications</h2>
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
                          <span className="text-sm text-slate-700">{labels[key]}</span>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                            className={cn(
                              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                              value ? "bg-indigo-600" : "bg-slate-200"
                            )}
                          >
                            <span className={cn(
                              "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow",
                              value ? "translate-x-4.5" : "translate-x-1"
                            )} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => toast.success("Notification preferences saved!")}
                    className="mt-4 w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Change Password */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Key className="w-5 h-5 text-slate-600" />
                  <div>
                    <h2 className="font-semibold text-slate-900">Change Password</h2>
                    <p className="text-xs text-slate-500">Use a strong, unique password</p>
                  </div>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {[
                    { label: "Current Password", show: showPassword, toggle: () => setShowPassword(!showPassword) },
                    { label: "New Password", show: showNewPassword, toggle: () => setShowNewPassword(!showNewPassword) },
                  ].map((field, idx) => (
                    <div key={idx}>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">{field.label}</label>
                      <div className="relative">
                        <input
                          type={field.show ? "text" : "password"}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button type="button" onClick={field.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirm New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                    {["At least 8 characters", "One uppercase letter", "One number", "One special character"].map(r => (
                      <div key={r} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                        {r}
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                    Update Password
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                {/* 2FA */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Smartphone className="w-5 h-5 text-slate-600" />
                    <div>
                      <h2 className="font-semibold text-slate-900">Two-Factor Authentication</h2>
                      <p className="text-xs text-slate-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">2FA is not enabled</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.info("2FA setup coming soon!")}
                    className="w-full py-2.5 border border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Enable 2FA
                  </button>
                </div>

                {/* Active Sessions */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Monitor className="w-5 h-5 text-slate-600" />
                    <div>
                      <h2 className="font-semibold text-slate-900">Active Sessions</h2>
                      <p className="text-xs text-slate-500">Manage your logged-in devices</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        session.isCurrent ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-200"
                      )}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-slate-900">{session.device}</p>
                            {session.isCurrent && (
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">Current</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{session.location} · {session.lastActive}</p>
                        </div>
                        {!session.isCurrent && (
                          <button
                            onClick={() => toast.success("Session revoked")}
                            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => toast.success("All other sessions revoked")}
                    className="mt-3 w-full py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    Revoke All Other Sessions
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
