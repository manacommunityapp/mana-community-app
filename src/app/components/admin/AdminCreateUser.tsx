import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast, Toaster } from "sonner";
import {
  UserPlus,
  ArrowLeft,
  Mail,
  Phone,
  User,
  MapPin,
  Building2,
  ShieldCheck,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  Calendar,
  CreditCard,
  Info,
  ChevronDown,
  Hash,
  Lock,
  Camera,
  UserCheck,
  Users,
  Shield,
  Briefcase,
  Bell,
  MessageSquare,
  Smartphone,
  Check,
  Search,
  Settings,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { communityService } from "../../../services/communityService";
import { userService } from "../../../services/userService";
import type { CommunityResponse } from "../../../types/api";

type UserRole = "admin" | "committee" | "resident" | "security" | "vendor" | "staff";

interface FormState {
  profilePic: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  isActive: boolean;
  gender: string;
  dob: string;
  phone: string;
  email: string;
  communityCode: string;
  block: string;
  tower: string;
  flatNumber: string;
  residentType: string;
  ownerTenant: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  prefEmail: boolean;
  prefSms: boolean;
  prefWhatsapp: boolean;
  prefPush: boolean;
}

const initialForm: FormState = {
  profilePic: "",
  firstName: "",
  lastName: "",
  employeeId: "",
  isActive: true,
  gender: "",
  dob: "",
  phone: "",
  email: "",
  communityCode: "",
  block: "",
  tower: "",
  flatNumber: "",
  residentType: "Resident",
  ownerTenant: "Owner",
  username: "",
  password: "",
  confirmPassword: "",
  role: "resident",
  prefEmail: true,
  prefSms: false,
  prefWhatsapp: true,
  prefPush: true,
};

const roleConfig = {
  admin: {
    label: "Admin",
    desc: "Full administrative controls and portal management",
    icon: ShieldCheck,
    color: "indigo",
    badgeBg: "bg-indigo-50 border-indigo-200 text-indigo-700",
  },
  committee: {
    label: "Committee",
    desc: "Management of tasks, approvals, and events",
    icon: Users,
    color: "purple",
    badgeBg: "bg-purple-50 border-purple-200 text-purple-700",
  },
  resident: {
    label: "Resident",
    desc: "Standard community portal features & facility access",
    icon: User,
    color: "green",
    badgeBg: "bg-green-50 border-green-200 text-green-700",
  },
  security: {
    label: "Security",
    desc: "Gatekeeper visitor logs and safety alert updates",
    icon: Shield,
    color: "red",
    badgeBg: "bg-red-50 border-red-200 text-red-700",
  },
  vendor: {
    label: "Vendor",
    desc: "Service directory listings and catalog offers",
    icon: Building2,
    color: "blue",
    badgeBg: "bg-blue-50 border-blue-200 text-blue-700",
  },
  staff: {
    label: "Staff",
    desc: "Housekeeping, facilities, and maintenance access",
    icon: Briefcase,
    color: "slate",
    badgeBg: "bg-slate-50 border-slate-200 text-slate-700",
  },
};

const colorClasses: Record<string, { border: string; bg: string; ring: string; iconBg: string; iconText: string; checkBg: string }> = {
  indigo: {
    border: "border-indigo-500",
    bg: "bg-indigo-50/50",
    ring: "ring-indigo-500/10",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-600",
    checkBg: "bg-indigo-600",
  },
  purple: {
    border: "border-purple-500",
    bg: "bg-purple-50/50",
    ring: "ring-purple-500/10",
    iconBg: "bg-purple-100",
    iconText: "text-purple-600",
    checkBg: "bg-purple-600",
  },
  green: {
    border: "border-emerald-500",
    bg: "bg-emerald-50/50",
    ring: "ring-emerald-500/10",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    checkBg: "bg-emerald-600",
  },
  red: {
    border: "border-rose-500",
    bg: "bg-rose-50/50",
    ring: "ring-rose-500/10",
    iconBg: "bg-rose-100",
    iconText: "text-rose-600",
    checkBg: "bg-rose-600",
  },
  blue: {
    border: "border-sky-500",
    bg: "bg-sky-50/50",
    ring: "ring-sky-500/10",
    iconBg: "bg-sky-100",
    iconText: "text-sky-600",
    checkBg: "bg-sky-600",
  },
  slate: {
    border: "border-slate-500",
    bg: "bg-slate-50/50",
    ring: "ring-slate-500/10",
    iconBg: "bg-slate-100",
    iconText: "text-slate-600",
    checkBg: "bg-slate-600",
  },
};

export function AdminCreateUser() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-slate-500 font-medium">Access Denied. Administrative privileges required.</p>
        <button onClick={() => navigate("/")} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Go to Feed</button>
      </div>
    );
  }

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Advanced settings toggle
  const [showAdvanced, setShowAdvanced] = useState(true);
  
  // Communities drop down search states
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [communitySearch, setCommunitySearch] = useState("");
  const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    communityService.getCommunities()
      .then(setCommunities)
      .catch(() => toast.error("Failed to load communities"));
  }, []);

  // Handle click outside community dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCommunityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCommunity = communities.find(c => String(c.id) === form.communityCode);

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(communitySearch.toLowerCase())
  );

  const update = (field: keyof FormState, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        update("profilePic", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculatePasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: "None", color: "bg-slate-200" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 4) return { score, label: "Medium", color: "bg-amber-500" };
    return { score, label: "Strong", color: "bg-green-500" };
  };

  const pwdStrength = calculatePasswordStrength(form.password);

  const validate = () => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    
    // Required base fields
    if (!form.communityCode) newErrors.communityCode = "Please select a community";
    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email address";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!form.gender) newErrors.gender = "Gender is required";
    if (!form.dob) newErrors.dob = "Date of birth is required";

    // Password validations (if username or password is typed)
    if (form.username.trim() || form.password || form.confirmPassword) {
      if (!form.username.trim()) newErrors.username = "Username is required for logins";
      if (!form.password) newErrors.password = "Password is required";
      else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
      
      if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = () => {
    setForm(initialForm);
    setCommunitySearch("");
    setErrors({});
    toast.info("Form fields have been reset");
  };

  const handleSave = async (addAnother = false) => {
    if (!validate()) {
      toast.error("Please resolve validation errors before saving.");
      return;
    }
    setIsSubmitting(true);
    try {
      await userService.createUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dob,
        gender: form.gender,
        profilePic: form.profilePic || undefined,
        employeeId: form.employeeId || undefined,
        isActive: form.isActive,
        communityId: selectedCommunity ? Number(selectedCommunity.id) : undefined,
        inviteCode: selectedCommunity?.inviteCode || selectedCommunity?.code || undefined,
        block: form.block || undefined,
        tower: form.tower || undefined,
        flatNo: form.flatNumber || undefined,
        residentType: form.residentType || undefined,
        occupancyStatus: form.ownerTenant || undefined,
        password: form.password || undefined,
        role: form.role,
        prefEmail: form.prefEmail,
        prefSms: form.prefSms,
        prefWhatsapp: form.prefWhatsapp,
        prefPush: form.prefPush,
      });

      toast.success(`User ${form.firstName} ${form.lastName} created successfully!`);
      
      if (addAnother) {
        setForm(initialForm);
        setCommunitySearch("");
        setErrors({});
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      console.error("Failed to create user:", err);
      toast.error(err?.message || "Failed to create user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto bg-white/70 backdrop-blur-md border border-slate-200/50 p-8 rounded-2xl shadow-xl">
        <Toaster position="top-center" richColors />
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6 ring-8 ring-green-500/10">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">User Created Successfully</h2>
        <p className="text-slate-600 mb-6">
          <strong>{form.firstName} {form.lastName}</strong> has been registered to the community dashboard as a{" "}
          <strong className="capitalize">{form.role}</strong>.
        </p>
        <div className="flex gap-3 justify-center w-full">
          <button
            onClick={() => { setForm(initialForm); setIsSuccess(false); }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Another User
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-all"
          >
            Go to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-12" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white/50 backdrop-blur-md border border-slate-200/40 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin")}
            className="p-2.5 hover:bg-slate-100/80 rounded-xl text-slate-500 transition-colors border border-slate-200/50 bg-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              <span>Admin Hub</span>
              <span>/</span>
              <span>User Manager</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              <UserPlus className="w-6 h-6 text-indigo-600" />
              Create New User
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">Register a verified resident, staff, or committee profile</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white rounded-xl font-medium text-sm transition-all"
          >
            Reset Fields
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white rounded-xl font-medium text-sm transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Profile Card & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* User Profile Card */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                form.isActive 
                  ? "bg-green-50 border-green-200 text-green-700" 
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${form.isActive ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
                {form.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="relative group mt-4">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-50 flex items-center justify-center relative">
                {form.profilePic ? (
                  <img src={form.profilePic} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-slate-300" />
                )}
                
                {/* Photo Upload Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <h3 className="text-lg font-bold text-slate-800 mt-4 leading-snug">
              {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}` : "User Profile Name"}
            </h3>
            
            <div className="mt-2 w-full space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Resident / Employee ID</span>
                <input
                  type="text"
                  placeholder="e.g. RES-9021"
                  value={form.employeeId}
                  onChange={e => update("employeeId", e.target.value)}
                  className="w-1/2 text-right border-none outline-none focus:ring-0 p-0 text-slate-700 font-semibold bg-transparent"
                />
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Account Access</span>
                <button
                  type="button"
                  onClick={() => update("isActive", !form.isActive)}
                  className={`text-xs font-semibold px-2 py-0.5 rounded transition-colors ${
                    form.isActive ? "text-indigo-600 hover:bg-indigo-50" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  Toggle State
                </button>
              </div>
            </div>
          </div>

          {/* Persistent Target Community Selector Card */}
          <div ref={dropdownRef} className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm relative">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider text-indigo-600">
              <Building2 className="w-4 h-4" /> Community Link
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Assign the target community group first</p>

            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              
              {/* Custom Searchable Input Trigger */}
              <div
                onClick={() => setIsCommunityDropdownOpen(!isCommunityDropdownOpen)}
                className={`w-full pl-9 pr-8 py-2.5 border rounded-xl text-sm bg-white cursor-pointer transition-shadow flex items-center justify-between ${
                  errors.communityCode ? "border-red-400 ring-2 ring-red-500/10 bg-red-50/20" : "border-slate-300"
                }`}
              >
                <span className={selectedCommunity ? "text-slate-800 font-medium" : "text-slate-400"}>
                  {selectedCommunity ? selectedCommunity.name : "Search & Select Community"}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>

              {/* Dropdown Options List */}
              {isCommunityDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-slate-100 flex items-center bg-slate-50/50">
                    <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search communities..."
                      value={communitySearch}
                      onChange={e => setCommunitySearch(e.target.value)}
                      className="w-full bg-transparent outline-none border-none text-xs p-1"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                    {filteredCommunities.length ? (
                      filteredCommunities.map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            update("communityCode", String(c.id));
                            setIsCommunityDropdownOpen(false);
                          }}
                          className={`px-4 py-2.5 text-xs hover:bg-slate-50 cursor-pointer flex items-center justify-between ${
                            form.communityCode === String(c.id) ? "bg-indigo-50/50 font-semibold text-indigo-600" : "text-slate-700"
                          }`}
                        >
                          <span>{c.name}</span>
                          {form.communityCode === String(c.id) && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-slate-400 text-center">No communities found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.communityCode && <p className="text-xs text-red-500 mt-1.5">{errors.communityCode}</p>}
            {selectedCommunity && (selectedCommunity.inviteCode || selectedCommunity.code) && (
              <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1.5 bg-indigo-50/50 py-1.5 px-3 rounded-lg border border-indigo-100">
                <Hash className="w-3.5 h-3.5 flex-shrink-0" /> Invite Code: <strong>{selectedCommunity.inviteCode || selectedCommunity.code}</strong>
              </p>
            )}
          </div>

          {/* Section C: Role & Permissions Card Selector (Moved to Left Side Column) */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider text-indigo-600">
                <UserCheck className="w-4 h-4" /> Role &amp; Permissions
              </h3>
              <p className="text-xs text-slate-500 mt-1">Assign portal role permissions profile</p>
            </div>

            <div className="space-y-2.5">
              {(Object.entries(roleConfig) as [UserRole, typeof roleConfig.admin][]).map(([roleKey, config]) => {
                const isActive = form.role === roleKey;
                const cls = colorClasses[config.color] || colorClasses.slate;
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => update("role", roleKey)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-center gap-3 relative overflow-hidden group cursor-pointer w-full ${
                      isActive 
                        ? `${cls.border} ${cls.bg} ring-4 ${cls.ring}` 
                        : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                      isActive ? cls.iconBg : "bg-slate-100 group-hover:bg-slate-200"
                    }`}>
                      <config.icon className={`w-4 h-4 ${
                        isActive ? cls.iconText : "text-slate-500"
                      }`} />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{config.label}</p>
                      <p className="text-[10px] text-slate-400 leading-snug truncate" title={config.desc}>{config.desc}</p>
                    </div>

                    {isActive && (
                      <span className={`w-4.5 h-4.5 rounded-full ${cls.checkBg} text-white flex items-center justify-center shrink-0`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Form Wizard Inputs */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section A: Personal Information */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider text-indigo-600">
                <User className="w-4 h-4" /> Personal Information
              </h3>
              <p className="text-xs text-slate-500 mt-1">Identity credentials of the new user</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">First Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Priya"
                  value={form.firstName}
                  onChange={e => update("firstName", e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                    errors.firstName ? "border-red-400 ring-2 ring-red-500/10 bg-red-50/20" : "border-slate-200"
                  }`}
                />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Last Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Sharma"
                  value={form.lastName}
                  onChange={e => update("lastName", e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                    errors.lastName ? "border-red-400 ring-2 ring-red-500/10 bg-red-50/20" : "border-slate-200"
                  }`}
                />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Gender <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={form.gender}
                    onChange={e => update("gender", e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white ${
                      errors.gender ? "border-red-400 ring-2 ring-red-500/10 bg-red-50/20" : "border-slate-200"
                    }`}
                  >
                    <option value="">Select gender</option>
                    {["Male", "Female", "Other", "Prefer not to say"].map(g => <option key={g}>{g}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={form.dob}
                    onChange={e => update("dob", e.target.value)}
                    className={`w-full pl-9 pr-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      errors.dob ? "border-red-400 ring-2 ring-red-500/10 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                </div>
                {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => update("phone", e.target.value)}
                    className={`w-full pl-9 pr-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      errors.phone ? "border-red-400 ring-2 ring-red-500/10 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={e => update("email", e.target.value)}
                    className={`w-full pl-9 pr-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      errors.email ? "border-red-400 ring-2 ring-red-500/10 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Section B: Community Unit Details */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider text-indigo-600">
                <MapPin className="w-4 h-4" /> Community Details
              </h3>
              <p className="text-xs text-slate-500 mt-1">Specify block structure and occupant rules</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Block / Zone</label>
                <input
                  type="text"
                  placeholder="e.g. Block A"
                  value={form.block}
                  onChange={e => update("block", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tower / Wing</label>
                <input
                  type="text"
                  placeholder="e.g. Tower 2"
                  value={form.tower}
                  onChange={e => update("tower", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Flat / Unit Number</label>
                <input
                  type="text"
                  placeholder="e.g. Apt 402"
                  value={form.flatNumber}
                  onChange={e => update("flatNumber", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Resident Type</label>
                <div className="relative">
                  <select
                    value={form.residentType}
                    onChange={e => update("residentType", e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none appearance-none bg-white"
                  >
                    {["Resident", "Non-Resident", "Guest"].map(rt => <option key={rt}>{rt}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Occupancy Status</label>
                <div className="relative">
                  <select
                    value={form.ownerTenant}
                    onChange={e => update("ownerTenant", e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none appearance-none bg-white"
                  >
                    {["Owner", "Tenant", "Staff"].map(ot => <option key={ot}>{ot}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Role & Permissions selector moved to left sidebar column */}

          {/* Collapsible Section D: Advanced Settings (Login Info, Preferences) */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex justify-between items-center w-full focus:outline-none"
            >
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider text-indigo-600">
                <Settings className="w-4 h-4" /> Advanced Settings
              </h3>
              <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <span>{showAdvanced ? "Collapse" : "Expand Login & Notifications"}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </div>
            </button>
            <p className="text-xs text-slate-500">Enable credential setups and message alert priorities</p>

            {showAdvanced && (
              <div className="pt-4 border-t border-slate-100 space-y-6">
                
                {/* Login Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Portal Account Credentials
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username</label>
                      <input
                        type="text"
                        placeholder="e.g. priya.sharma"
                        value={form.username}
                        onChange={e => update("username", e.target.value)}
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                          errors.username ? "border-red-400 ring-2 ring-red-500/10 bg-red-50/20" : "border-slate-200"
                        }`}
                      />
                      {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                    </div>

                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Temporary Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            value={form.password}
                            onChange={e => update("password", e.target.value)}
                            className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                              errors.password ? "border-red-400 ring-2 ring-red-500/10 bg-red-50/20" : "border-slate-200"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                        
                        {/* Strength Meter */}
                        {form.password && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-semibold">
                              <span className="text-slate-400">Password Strength:</span>
                              <span className="text-slate-600 uppercase">{pwdStrength.label}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-350 ${pwdStrength.color}`} 
                                style={{ width: `${(pwdStrength.score / 5) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Re-enter password"
                            value={form.confirmPassword}
                            onChange={e => update("confirmPassword", e.target.value)}
                            className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                              errors.confirmPassword ? "border-red-400 ring-2 ring-red-500/10 bg-red-50/20" : "border-slate-200"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" /> Notification Preferences
                  </h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: "prefEmail" as keyof FormState, icon: Mail, label: "Email Alerts" },
                      { key: "prefSms" as keyof FormState, icon: Phone, label: "SMS Alerts" },
                      { key: "prefWhatsapp" as keyof FormState, icon: MessageSquare, label: "WhatsApp" },
                      { key: "prefPush" as keyof FormState, icon: Smartphone, label: "Push Notification" },
                    ].map(pref => {
                      const isActive = form[pref.key] as boolean;
                      return (
                        <button
                          key={pref.key}
                          type="button"
                          onClick={() => update(pref.key, !isActive)}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                            isActive 
                              ? "border-indigo-500 bg-indigo-50/30 text-indigo-700 font-semibold" 
                              : "border-slate-200 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <pref.icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                          <span className="text-[11px]">{pref.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer order-first sm:order-last"
            >
              {isSubmitting ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Saving User...</>
              ) : (
                <>Save User</>
              )}
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-600/15 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? "Processing..." : "Save & Add Another"}
            </button>

            <button
              onClick={handleReset}
              className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white rounded-xl font-medium text-sm transition-all"
            >
              Reset Fields
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
