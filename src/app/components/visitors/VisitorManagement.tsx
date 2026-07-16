import {
  Shield, Plus, X, Loader2, LogIn, LogOut, UserCheck, Clock, Car, Phone,
  Search, Ban, Copy, Check, Users, ChevronDown, Sparkles, Upload, 
  History, BarChart3, Key, Camera, CheckCircle2, AlertTriangle, Eye
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { visitorService, type VisitorPassResponse, type VisitorPassRequest, type VisitorAuditLog, type VisitorAnalytics } from "../../../services/visitorService";
import { userService } from "../../../services/userService";
import type { UserResponse } from "../../../types/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type PortalView = "resident" | "guard" | "admin";
type PassTypeKey = "GUEST" | "DELIVERY" | "MAID" | "VENDOR" | "FAMILY" | "RECURRING" | "PRE_APPROVED" | "WALK_IN" | "OTHER";

const passTypeLabels: Record<PassTypeKey, string> = {
  GUEST: "Guest",
  DELIVERY: "Delivery",
  MAID: "Maid",
  VENDOR: "Vendor",
  FAMILY: "Family",
  RECURRING: "Recurring",
  PRE_APPROVED: "Pre-Approved",
  WALK_IN: "Walk-In",
  OTHER: "Other"
};

const passTypeColors: Record<PassTypeKey, string> = {
  GUEST: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERY: "bg-amber-50 text-amber-700 border-amber-200",
  MAID: "bg-teal-50 text-teal-700 border-teal-200",
  VENDOR: "bg-sky-50 text-sky-700 border-sky-200",
  FAMILY: "bg-pink-50 text-pink-700 border-pink-200",
  RECURRING: "bg-purple-50 text-purple-700 border-purple-200",
  PRE_APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  WALK_IN: "bg-orange-50 text-orange-700 border-orange-200",
  OTHER: "bg-slate-50 text-slate-700 border-slate-200"
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending Approval", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  APPROVED: { label: "Approved (Awaiting Gate)", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  CHECKED_IN: { label: "Inside Community", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  CHECKED_OUT: { label: "Checked Out / Left", color: "text-slate-500", bg: "bg-slate-50 border-slate-200" },
  REJECTED: { label: "Rejected / Cancelled", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  EXPIRED: { label: "Expired", color: "text-slate-400", bg: "bg-slate-50 border-slate-200" },
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function VisitorManagement() {
  const [portal, setPortal] = useState<PortalView>("resident");
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [residents, setResidents] = useState<UserResponse[]>([]);
  
  // Lists
  const [myPasses, setMyPasses] = useState<VisitorPassResponse[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<VisitorPassResponse[]>([]);
  const [allPasses, setAllPasses] = useState<VisitorPassResponse[]>([]);
  const [auditLogs, setAuditLogs] = useState<VisitorAuditLog[]>([]);
  
  // Analytics
  const [analytics, setAnalytics] = useState<VisitorAnalytics | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Search queries
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Forms
  const [showCreate, setShowCreate] = useState(false);
  const [invitationPass, setInvitationPass] = useState<VisitorPassResponse | null>(null);

  // Fetch critical profile & resident metadata
  useEffect(() => {
    async function loadIdentity() {
      try {
        const profile = await userService.getMe();
        setCurrentUser(profile);
        
        // Auto-switch portal view depending on role
        if (profile.role === "GUARD" || profile.role === "GATEKEEPER") {
          setPortal("guard");
        } else if (profile.role === "ADMIN") {
          setPortal("admin");
        }

        // Search residents for guard walk-in select
        if (profile.communityId) {
          const list = await userService.getCommunityUsers(profile.communityId);
          setResidents(list.filter(u => u.role === "MEMBER" || u.role === "RESIDENT"));
        } else {
          const list = await userService.getAllUsers();
          setResidents(list);
        }
      } catch (err) {
        console.error("Failed to load user credentials", err);
      }
    }
    loadIdentity();
  }, []);

  // Fetch lists depending on active portal view
  const fetchPortalData = useCallback(async () => {
    setLoading(true);
    try {
      if (portal === "resident") {
        const my = await visitorService.getMyPasses();
        setMyPasses(my);
        const pending = await visitorService.getPendingApprovals();
        setPendingApprovals(pending);
      } else if (portal === "guard") {
        const today = await visitorService.getTodaysPasses();
        setAllPasses(today);
      } else if (portal === "admin") {
        const all = await visitorService.getCommunityPasses();
        setAllPasses(all);
        const stats = await visitorService.getAnalytics();
        setAnalytics(stats);
        const logs = await visitorService.getAuditLogs();
        setAuditLogs(logs);
      }
    } catch (e) {
      console.error("Failed to load visitor passes", e);
    } finally {
      setLoading(false);
    }
  }, [portal]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  // Periodic polling for resident approvals (mock real-time push events)
  useEffect(() => {
    if (portal !== "resident") return;
    const interval = setInterval(async () => {
      try {
        const pending = await visitorService.getPendingApprovals();
        setPendingApprovals(prev => {
          // Only update if length changed or statuses are different
          if (prev.length !== pending.length) {
            return pending;
          }
          return prev;
        });
      } catch (e) {
        // Suppress background errors
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [portal]);

  // Resident Approvals
  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await visitorService.approveWalkIn(id);
      fetchPortalData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await visitorService.reject(id);
      fetchPortalData();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen text-slate-800 p-6 bg-slate-50/50 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div>
          <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            Visitor Management Suite
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-2 tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            Community Gatekeeping
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Track visitors, issue entry codes, scan credentials, and grant walk-in approvals.
          </p>
        </div>

        {/* Portal Switching Tabs */}
        <div className="flex bg-slate-100 border border-slate-200/60 rounded-2xl p-1 gap-1 self-start lg:self-auto shadow-inner">
          <button
            onClick={() => setPortal("resident")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              portal === "resident" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <UserCheck className="w-4 h-4" />
            Resident Portal
          </button>
          <button
            onClick={() => setPortal("guard")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              portal === "guard" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Shield className="w-4 h-4" />
            Security Guard Gate
          </button>
          <button
            onClick={() => setPortal("admin")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              portal === "admin" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Management Committee
          </button>
        </div>
      </div>

      {/* Portal view renders */}
      <div className="space-y-6">
        {portal === "resident" && (
          <ResidentPortalView
            myPasses={myPasses}
            pendingApprovals={pendingApprovals}
            loading={loading}
            onCreateOpen={() => setShowCreate(true)}
            onApprove={handleApprove}
            onReject={handleReject}
            actionLoading={actionLoading}
          />
        )}

        {portal === "guard" && (
          <GuardPortalView
            todaysPasses={allPasses}
            residents={residents}
            loading={loading}
            onRefresh={fetchPortalData}
          />
        )}

        {portal === "admin" && (
          <AdminPortalView
            allPasses={allPasses}
            analytics={analytics}
            auditLogs={auditLogs}
            loading={loading}
          />
        )}
      </div>

      {/* Create Pass Modal */}
      {showCreate && (
        <CreatePassModal
          onClose={() => setShowCreate(false)}
          onCreated={(pass) => {
            setShowCreate(false);
            setInvitationPass(pass);
            fetchPortalData();
          }}
        />
      )}

      {/* Generated Invitation Showcase Modal */}
      {invitationPass && (
        <InvitationModal
          pass={invitationPass}
          onClose={() => setInvitationPass(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESIDENT PORTAL VIEW
// ─────────────────────────────────────────────────────────────────────────────
interface ResidentPortalProps {
  myPasses: VisitorPassResponse[];
  pendingApprovals: VisitorPassResponse[];
  loading: boolean;
  onCreateOpen: () => void;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
  actionLoading: number | null;
}

function ResidentPortalView({
  myPasses, pendingApprovals, loading, onCreateOpen, onApprove, onReject, actionLoading
}: ResidentPortalProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* Left side: Main history and list */}
      <div className="xl:col-span-2 space-y-6">
        {/* Approvals notification inbox */}
        {pendingApprovals.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-bounce" />
              <h2 className="text-sm font-extrabold text-amber-800 uppercase tracking-wider">
                Pending Gate Approvals ({pendingApprovals.length})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApprovals.map((pass) => (
                <div key={pass.id} className="bg-white border border-amber-200/80 rounded-2xl p-4 flex gap-4 shadow-sm">
                  {/* Photo or Avatar */}
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                    {pass.visitorPhoto ? (
                      <img src={pass.visitorPhoto} alt={pass.visitorName} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">{pass.visitorName}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{pass.purpose}</p>
                      <p className="text-[9px] text-indigo-600 font-bold mt-1">Gate: {pass.gateIn || "N/A"}</p>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onApprove(pass.id)}
                        disabled={actionLoading === pass.id}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg cursor-pointer transition-all disabled:opacity-50"
                      >
                        {actionLoading === pass.id ? "..." : "APPROVE"}
                      </button>
                      <button
                        onClick={() => onReject(pass.id)}
                        disabled={actionLoading === pass.id}
                        className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black rounded-lg cursor-pointer transition-all border border-red-250 disabled:opacity-50"
                      >
                        REJECT
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Passes Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              My Visitor Log
            </h2>
            <button
              onClick={onCreateOpen}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Invite Guest
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : myPasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Shield className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm font-semibold">No visitor invites created yet</p>
              <p className="text-slate-400 text-xs mt-1">Tap the invite button to issue entry codes.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myPasses.map((pass) => (
                <div key={pass.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-black text-indigo-600 border border-slate-200 shrink-0">
                      {pass.visitorName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{pass.visitorName}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-semibold">
                        <span className={cn("px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase", passTypeColors[pass.passType as PassTypeKey] || "bg-slate-50 text-slate-700 border-slate-200")}>
                          {passTypeLabels[pass.passType as PassTypeKey] || pass.passType}
                        </span>
                        {pass.visitorPhone && <span>{pass.visitorPhone}</span>}
                        {pass.vehicleNumber && <span>({pass.vehicleNumber})</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-between md:justify-end">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-slate-400 font-bold">CREATED ON</div>
                      <div className="text-xs font-extrabold text-slate-800">{formatDate(pass.createdAt)}</div>
                    </div>

                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-slate-400 font-bold">STATUS</div>
                      <div className={cn("text-xs font-black", statusConfig[pass.status]?.color || "text-slate-600")}>
                        {statusConfig[pass.status]?.label || pass.status}
                      </div>
                    </div>
                    
                    {/* View code option for Approved invites */}
                    {pass.status === "APPROVED" && (
                      <div className="bg-indigo-50 px-2 py-1 rounded-lg text-indigo-700 font-mono text-[10px] font-black tracking-wider">
                        OTP: {pass.otp}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Instructions / Resident FAQ info */}
      <div className="space-y-6">
        <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-32 h-32 rounded-full bg-indigo-800/60" />
          <Sparkles className="w-6 h-6 text-yellow-400 mb-4" />
          <h3 className="text-base font-black tracking-tight">How Inviting Guests Works</h3>
          <ul className="mt-4 space-y-3 text-xs text-indigo-200/90 font-medium">
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-800/80 flex items-center justify-center shrink-0 text-[10px] font-black text-white">1</span>
              <span>Fill out the guest invitation form with visitor name and type.</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-800/80 flex items-center justify-center shrink-0 text-[10px] font-black text-white">2</span>
              <span>Share the generated **QR Code** or **6-digit OTP** with them.</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-800/80 flex items-center justify-center shrink-0 text-[10px] font-black text-white">3</span>
              <span>The visitor shows the credentials to the guard at the entrance gate.</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-800/80 flex items-center justify-center shrink-0 text-[10px] font-black text-white">4</span>
              <span>Once scanned, you receive an instant push notification of their arrival.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY GUARD GATE PORTAL VIEW
// ─────────────────────────────────────────────────────────────────────────────
interface GuardPortalProps {
  todaysPasses: VisitorPassResponse[];
  residents: UserResponse[];
  loading: boolean;
  onRefresh: () => void;
}

function GuardPortalView({ todaysPasses, residents, loading, onRefresh }: GuardPortalProps) {
  const [searchVal, setSearchVal] = useState("");
  const [verifiedPass, setVerifiedPass] = useState<VisitorPassResponse | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Check-in input states
  const [gate, setGate] = useState("Gate 1");
  const [guardName, setGuardName] = useState("Guard Ravi");
  const [photoBlob, setPhotoBlob] = useState<string | null>(null);

  // Walk-in Registration states
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [walkInForm, setWalkInForm] = useState<VisitorPassRequest>({
    visitorName: "",
    visitorPhone: "",
    purpose: "",
    passType: "WALK_IN",
    residentId: undefined,
    flatNumber: "",
    gate: "Gate 1",
    guard: "Guard Ravi",
    visitorPhoto: ""
  });
  const [walkInSaving, setWalkInSaving] = useState(false);
  const [walkInError, setWalkInError] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const walkInPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    setVerifyLoading(true);
    setVerifyError("");
    setVerifiedPass(null);
    try {
      const result = await visitorService.verifyPass(searchVal);
      setVerifiedPass(result);
    } catch (err: any) {
      setVerifyError(err?.message || "No active pass matching that credential code.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleCheckInSubmit = async () => {
    if (!verifiedPass) return;
    setVerifyLoading(true);
    try {
      await visitorService.checkInWithOptions(verifiedPass.id, gate, guardName, photoBlob || undefined);
      setVerifiedPass(null);
      setSearchVal("");
      setPhotoBlob(null);
      onRefresh();
    } catch (err: any) {
      setVerifyError(err?.message || "Check-in failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleCheckOutSubmit = async (passId: number) => {
    setVerifyLoading(true);
    try {
      await visitorService.checkOutWithOptions(passId, gate, guardName);
      setVerifiedPass(null);
      setSearchVal("");
      onRefresh();
    } catch (err: any) {
      setVerifyError(err?.message || "Check-out failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDenyEntry = async (id: number) => {
    setVerifyLoading(true);
    try {
      await visitorService.reject(id);
      setVerifiedPass(null);
      setSearchVal("");
      onRefresh();
    } catch (err: any) {
      setVerifyError(err?.message || "Failed to deny entry");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "checkin" | "walkin") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (field === "checkin") {
        setPhotoBlob(reader.result as string);
      } else {
        setWalkInForm(prev => ({ ...prev, visitorPhoto: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleWalkInRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInForm.visitorName.trim()) {
      setWalkInError("Visitor name is required");
      return;
    }
    if (!walkInForm.residentId) {
      setWalkInError("Host Resident is required");
      return;
    }
    setWalkInSaving(true);
    setWalkInError("");
    try {
      // Find selected resident's flat automatically if blank
      const selectedRes = residents.find(r => r.id === Number(walkInForm.residentId));
      const payload = {
        ...walkInForm,
        flatNumber: walkInForm.flatNumber || (selectedRes ? selectedRes.flatNo : "")
      };
      await visitorService.createWalkIn(payload);
      setShowWalkInForm(false);
      setWalkInForm({
        visitorName: "",
        visitorPhone: "",
        purpose: "",
        passType: "WALK_IN",
        residentId: undefined,
        flatNumber: "",
        gate: "Gate 1",
        guard: "Guard Ravi",
        visitorPhoto: ""
      });
      onRefresh();
    } catch (err: any) {
      setWalkInError(err?.message || "Failed to submit walk-in request.");
    } finally {
      setWalkInSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* Verify & Check-in Panel */}
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-6 border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-500" />
              Verify Visitor Pass (QR / OTP / Phone)
            </h2>
            <button
              onClick={() => setShowWalkInForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register Walk-In
            </button>
          </div>

          <form onSubmit={handleVerify} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
              <input
                type="text"
                placeholder="Enter 6-digit OTP, pass code, or visitor phone..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 font-bold transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={verifyLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl cursor-pointer disabled:opacity-50"
            >
              {verifyLoading ? "Checking..." : "Verify"}
            </button>
          </form>

          {verifyError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5" />
              {verifyError}
            </div>
          )}

          {/* Verification details pane */}
          {verifiedPass && (
            <div className="mt-6 border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {verifiedPass.visitorPhoto ? (
                    <img src={verifiedPass.visitorPhoto} alt={verifiedPass.visitorName} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className={cn("px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider", passTypeColors[verifiedPass.passType as PassTypeKey] || "bg-slate-50 text-slate-700 border-slate-200")}>
                    {passTypeLabels[verifiedPass.passType as PassTypeKey] || verifiedPass.passType}
                  </span>
                  
                  <h3 className="text-base font-black text-slate-900 mt-2">{verifiedPass.visitorName}</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-xs font-semibold text-slate-600">
                    <div><span className="text-slate-400">Phone:</span> {verifiedPass.visitorPhone || "—"}</div>
                    <div><span className="text-slate-400">Vehicle:</span> {verifiedPass.vehicleNumber || "—"}</div>
                    <div><span className="text-slate-400">Purpose:</span> {verifiedPass.purpose || "—"}</div>
                    <div><span className="text-slate-400">Host Flat:</span> {verifiedPass.flatNumber}</div>
                    <div><span className="text-slate-400">Resident Host:</span> {verifiedPass.residentName}</div>
                    <div><span className="text-slate-400">Pass Code:</span> {verifiedPass.passCode}</div>
                  </div>
                </div>
              </div>

              {/* Expiry/Status Warnings */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Verification Status:</div>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-black border", statusConfig[verifiedPass.status]?.bg, statusConfig[verifiedPass.status]?.color)}>
                    {statusConfig[verifiedPass.status]?.label || verifiedPass.status}
                  </span>
                </div>
              </div>

              {/* Input for checkin gate details if pass is Approved */}
              {verifiedPass.status === "APPROVED" && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Entry Gate</label>
                    <select
                      value={gate}
                      onChange={e => setGate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      <option value="Gate 1">Gate 1 (Main Entrance)</option>
                      <option value="Gate 2">Gate 2 (Back Exit)</option>
                      <option value="Gate 3">Gate 3 (Service Gate)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Verifying Guard</label>
                    <input
                      type="text"
                      value={guardName}
                      onChange={e => setGuardName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Verify Photo ID / Entry Snap (Optional)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="file"
                        accept="image/*"
                        ref={photoInputRef}
                        onChange={e => handlePhotoUpload(e, "checkin")}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Snap Snapshot
                      </button>
                      {photoBlob && (
                        <div className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Snapshot Captured
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={handleCheckInSubmit}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-4 h-4" />
                      Approve Check-In Entry
                    </button>
                    <button
                      onClick={() => handleDenyEntry(verifiedPass.id)}
                      className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs rounded-xl transition-all border border-red-200 cursor-pointer"
                    >
                      Deny Entry
                    </button>
                  </div>
                </div>
              )}

              {/* Check Out options for inside passes */}
              {verifiedPass.status === "CHECKED_IN" && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Exit Gate</label>
                      <select
                        value={gate}
                        onChange={e => setGate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                      >
                        <option value="Gate 1">Gate 1 (Main Entrance)</option>
                        <option value="Gate 2">Gate 2 (Back Exit)</option>
                        <option value="Gate 3">Gate 3 (Service Gate)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Check-out Guard</label>
                      <input
                        type="text"
                        value={guardName}
                        onChange={e => setGuardName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleCheckOutSubmit(verifiedPass.id)}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    Complete Check-Out Exit
                  </button>
                </div>
              )}

              {/* Status information warning */}
              {verifiedPass.status === "PENDING" && (
                <div className="p-4 bg-yellow-50 border border-yellow-150 rounded-xl text-yellow-800 text-xs font-semibold leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <div>
                    Awaiting Approval. The resident has been notified of this walk-in request. This pass cannot be checked in until approved.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right column: Today's live log */}
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-h-[80vh] flex flex-col">
          <h2 className="text-base font-extrabold text-slate-900 border-b pb-4 mb-4 border-slate-100 flex items-center gap-1.5 shrink-0">
            <Clock className="w-4.5 h-4.5 text-indigo-500" />
            Today's Log Activity
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-20 shrink-0">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
          ) : todaysPasses.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs font-semibold shrink-0">
              No visits logged today.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {todaysPasses.map(p => (
                <div key={p.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-extrabold text-slate-900 truncate max-w-[120px]">{p.visitorName}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Flat {p.flatNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold border", statusConfig[p.status]?.bg, statusConfig[p.status]?.color)}>
                      {p.status === "CHECKED_IN" ? "INSIDE" : p.status === "CHECKED_OUT" ? "LEFT" : p.status}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-1">
                      {p.checkedInAt ? formatTime(p.checkedInAt) : "ETA: " + formatTime(p.expectedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Walk-in Register Modal */}
      {showWalkInForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">Walk-In Visitor Registration</h2>
              <button onClick={() => setShowWalkInForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleWalkInRegister} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {walkInError && (
                <p className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl">
                  {walkInError}
                </p>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Visitor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Courier boy / Plumber"
                  value={walkInForm.visitorName}
                  onChange={e => setWalkInForm(prev => ({ ...prev, visitorName: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={walkInForm.visitorPhone}
                    onChange={e => setWalkInForm(prev => ({ ...prev, visitorPhone: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={walkInForm.vehicleNumber}
                    onChange={e => setWalkInForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Visitor Purpose</label>
                  <input
                    type="text"
                    placeholder="e.g. Repair, Delivery"
                    value={walkInForm.purpose}
                    onChange={e => setWalkInForm(prev => ({ ...prev, purpose: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Visitor Type</label>
                  <select
                    value={walkInForm.passType}
                    onChange={e => setWalkInForm(prev => ({ ...prev, passType: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="DELIVERY">Delivery Personnel</option>
                    <option value="VENDOR">Utility Vendor / Plumber</option>
                    <option value="MAID">Housekeeping / Maid</option>
                    <option value="GUEST">Personal Guest</option>
                    <option value="FAMILY">Family Member</option>
                    <option value="OTHER">Other Walk-in</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h3 className="text-xs font-extrabold text-slate-900">Destination Resident Verification</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Host Resident *</label>
                    <select
                      required
                      value={walkInForm.residentId || ""}
                      onChange={e => setWalkInForm(prev => ({ ...prev, residentId: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="">Select Resident Host</option>
                      {residents.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.fullName} ({r.flatNo || "No Flat"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Flat Number Override</label>
                    <input
                      type="text"
                      placeholder="Autofills from Resident"
                      value={walkInForm.flatNumber}
                      onChange={e => setWalkInForm(prev => ({ ...prev, flatNumber: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Visitor Entry Snap</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    ref={walkInPhotoInputRef}
                    onChange={e => handlePhotoUpload(e, "walkin")}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => walkInPhotoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all cursor-pointer"
                  >
                    <Camera className="w-4.5 h-4.5" />
                    Snap Photo
                  </button>
                  {walkInForm.visitorPhoto && (
                    <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0">
                      <img src={walkInForm.visitorPhoto} alt="Walkin Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWalkInForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkInSaving}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {walkInSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Push Approval Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD & TIMELINE VIEW
// ─────────────────────────────────────────────────────────────────────────────
interface AdminPortalProps {
  allPasses: VisitorPassResponse[];
  analytics: VisitorAnalytics | null;
  auditLogs: VisitorAuditLog[];
  loading: boolean;
}

function AdminPortalView({ allPasses, analytics, auditLogs, loading }: AdminPortalProps) {
  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="ml-2 text-xs text-slate-500 font-bold">Compiling committee report...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: "Total Gate Passes Issued", value: analytics.totalPasses, color: "text-indigo-600", bg: "bg-indigo-50/50 border-indigo-100" },
          { label: "Visitors Currently Inside", value: analytics.currentlyInside, color: "text-emerald-600", bg: "bg-emerald-50/50 border-emerald-100" },
          { label: "Awaiting Resident Approvals", value: analytics.pendingApprovals, color: "text-amber-600", bg: "bg-amber-50/50 border-amber-100" },
          { label: "Scheduled Arrivals (Today)", value: analytics.awaitingEntry, color: "text-blue-600", bg: "bg-blue-50/50 border-blue-100" }
        ].map(w => (
          <div key={w.label} className={cn("border rounded-3xl p-5 shadow-sm bg-white flex flex-col justify-between", w.bg)}>
            <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider block mb-1">{w.label}</div>
            <div className={cn("text-3xl font-black mt-2", w.color)}>{w.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graph representation: category count */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-3 border-slate-100">
            Visitor Breakdown by Type
          </h3>
          <div className="space-y-3 pt-2">
            {Object.entries(analytics.categoryVisits || {}).map(([cat, val]) => {
              const total = analytics.totalPasses || 1;
              const pct = Math.round((val / total) * 100);
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="uppercase text-[10px] tracking-wider font-extrabold">{passTypeLabels[cat as PassTypeKey] || cat}</span>
                    <span>{val} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graph representation: peak hours */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-3 border-slate-100">
            Peak Visiting Hours (Arrivals)
          </h3>
          <div className="space-y-2 pt-2 max-h-60 overflow-y-auto pr-1">
            {Object.entries(analytics.hourlyVisits || {})
              .filter(([_, val]) => val > 0)
              .map(([hr, val]) => {
                const hourFormatted = Number(hr) === 0 ? "12 AM" : Number(hr) === 12 ? "12 PM" : Number(hr) > 12 ? `${Number(hr) - 12} PM` : `${hr} AM`;
                return (
                  <div key={hr} className="flex items-center gap-3 text-xs">
                    <span className="w-14 font-extrabold text-slate-500">{hourFormatted}</span>
                    <div className="flex-1 bg-slate-100 h-3 rounded-md overflow-hidden relative">
                      <div className="bg-emerald-500 h-full rounded-md" style={{ width: `${(val / (analytics.totalPasses || 1)) * 100}%` }} />
                    </div>
                    <span className="font-extrabold text-slate-700 shrink-0">{val} visits</span>
                  </div>
                );
              })}
            {Object.values(analytics.hourlyVisits || {}).filter(val => val > 0).length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                No arrival time stamps logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Most visited apartments */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-3 border-slate-100">
            Most Visited Apartments
          </h3>
          <div className="space-y-3 pt-2">
            {analytics.topVisitedFlats?.map((f, idx) => (
              <div key={f.flat} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 rounded-2xl text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-black text-[10px] text-slate-600">
                    {idx + 1}
                  </span>
                  <span className="font-extrabold text-slate-800">Flat {f.flat}</span>
                </div>
                <span className="font-bold text-indigo-600">{f.count} check-ins</span>
              </div>
            ))}
            {(!analytics.topVisitedFlats || analytics.topVisitedFlats.length === 0) && (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                No flat statistics available.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-3 border-slate-100 flex items-center gap-1.5">
          <History className="w-4 h-4 text-slate-400" />
          Security Audit Trails (Immutable Logs)
        </h3>
        
        <div className="overflow-x-auto border border-slate-150 rounded-2xl bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Visitor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Performed By</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
              {auditLogs.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/50">
                  <td className="p-4 whitespace-nowrap text-slate-400 font-bold">{formatDate(l.timestamp)} {formatTime(l.timestamp)}</td>
                  <td className="p-4 font-black text-slate-900">{l.visitorName}</td>
                  <td className="p-4">
                    <span className={cn("px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wide",
                      l.action === "CREATED" ? "bg-indigo-50 text-indigo-700 border-indigo-150" :
                      l.action === "ENTRY_COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                      l.action === "EXIT_COMPLETED" ? "bg-slate-50 text-slate-600 border-slate-200" :
                      l.action === "RESIDENT_APPROVED" ? "bg-blue-50 text-blue-700 border-blue-150" :
                      "bg-red-50 text-red-700 border-red-150"
                    )}>
                      {l.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4">{l.performedBy}</td>
                  <td className="p-4 text-slate-500">{l.details}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    No security events recorded in the audit logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE VISITOR PASS MODAL
// ─────────────────────────────────────────────────────────────────────────────
interface CreatePassProps {
  onClose: () => void;
  onCreated: (pass: VisitorPassResponse) => void;
}

function CreatePassModal({ onClose, onCreated }: CreatePassProps) {
  const [form, setForm] = useState<VisitorPassRequest>({
    visitorName: "",
    visitorPhone: "",
    vehicleNumber: "",
    purpose: "",
    passType: "GUEST",
    expectedAt: "",
    flatNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitorName.trim()) {
      setError("Visitor name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await visitorService.create(form);
      onCreated(response);
    } catch {
      setError("Failed to create visitor invitation pass. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof VisitorPassRequest, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <Plus className="w-5 h-5 text-indigo-500" />
            Issue Guest Invitation
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-red-500 text-xs font-semibold bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Visitor Name *</label>
            <input
              required
              value={form.visitorName}
              onChange={(e) => update("visitorName", e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Mobile Number</label>
              <input
                value={form.visitorPhone}
                onChange={(e) => update("visitorPhone", e.target.value)}
                maxLength={15}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Vehicle Number</label>
              <input
                value={form.vehicleNumber}
                onChange={(e) => update("vehicleNumber", e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                placeholder="Optional (e.g. KA 01 AB 1234)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Visitor Type</label>
              <select
                value={form.passType}
                onChange={(e) => update("passType", e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="GUEST">Personal Guest</option>
                <option value="DELIVERY">Delivery personnel</option>
                <option value="MAID">House Help / Maid</option>
                <option value="VENDOR">Utility Vendor</option>
                <option value="FAMILY">Family Member</option>
                <option value="RECURRING">Recurring (Daily)</option>
                <option value="OTHER">Other Type</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Destination Unit / Flat</label>
              <input
                value={form.flatNumber}
                onChange={(e) => update("flatNumber", e.target.value)}
                maxLength={30}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                placeholder="Optional (e.g. A-1004)"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Purpose of Visit</label>
            <input
              value={form.purpose}
              onChange={(e) => update("purpose", e.target.value)}
              maxLength={500}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              placeholder="e.g. Dinner party, delivery delivery, maintenance repair"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-black mb-1.5">Expected Date & Time</label>
            <input
              type="datetime-local"
              value={form.expectedAt}
              onChange={(e) => update("expectedAt", e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
              Generate Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INVITATION MODAL SHOWING OTP AND QR
// ─────────────────────────────────────────────────────────────────────────────
interface InvitationProps {
  pass: VisitorPassResponse;
  onClose: () => void;
}

function InvitationModal({ pass, onClose }: InvitationProps) {
  const [copied, setCopied] = useState(false);

  const invitationText = `Hello ${pass.visitorName},\n\nYou are invited to Flat ${pass.flatNumber || "A-1004"}.\nShow this OTP/QR code at the entrance for verification.\n\nOTP: ${pass.otp}\nValid till: 12 hours from generation.\n\nHosted by: ${pass.residentName}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(invitationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 p-6 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900 mt-3">Invitation Code Generated!</h2>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">Send these credentials to your guest to facilitate smooth entry.</p>
        </div>

        {/* QR Code & OTP Card */}
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 text-center space-y-4">
          <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Entry Credentials</div>
          
          {/* Simulated QR Code SVG */}
          <div className="w-36 h-36 bg-white border border-slate-200 rounded-xl p-2 mx-auto flex items-center justify-center shadow-inner">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
              {/* Simple stylized SVG QR Representation */}
              <rect x="0" y="0" width="30" height="30" fill="currentColor" />
              <rect x="5" y="5" width="20" height="20" fill="white" />
              <rect x="10" y="10" width="10" height="10" fill="currentColor" />
              
              <rect x="70" y="0" width="30" height="30" fill="currentColor" />
              <rect x="75" y="5" width="20" height="20" fill="white" />
              <rect x="80" y="10" width="10" height="10" fill="currentColor" />

              <rect x="0" y="70" width="30" height="30" fill="currentColor" />
              <rect x="5" y="75" width="20" height="20" fill="white" />
              <rect x="10" y="80" width="10" height="10" fill="currentColor" />

              {/* Dots representation */}
              <rect x="40" y="10" width="8" height="8" fill="currentColor" />
              <rect x="55" y="20" width="8" height="8" fill="currentColor" />
              <rect x="45" y="35" width="12" height="12" fill="currentColor" />
              <rect x="15" y="50" width="8" height="8" fill="currentColor" />
              <rect x="50" y="50" width="8" height="8" fill="currentColor" />
              <rect x="70" y="45" width="12" height="8" fill="currentColor" />
              <rect x="85" y="60" width="8" height="12" fill="currentColor" />
              <rect x="40" y="75" width="8" height="8" fill="currentColor" />
              <rect x="55" y="80" width="12" height="8" fill="currentColor" />
            </svg>
          </div>

          <div className="border-t border-slate-200/80 pt-4">
            <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Entry OTP (6-digits)</div>
            <div className="text-3xl font-black text-indigo-600 tracking-wider font-mono mt-1">{pass.otp}</div>
          </div>
        </div>

        {/* Copy / Direct Share Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Details"}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all border border-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
