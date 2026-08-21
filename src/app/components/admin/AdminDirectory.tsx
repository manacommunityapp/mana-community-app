import { useEffect, useState, useCallback, useRef } from "react";
import {
  Shield, Plus, Pencil, Trash2, X, Search, Inbox, Loader2,
  Phone, Mail, ArrowUpDown, Users, AlertTriangle,
  History, CheckCircle2, RotateCcw, Wrench,
  Building2, Sparkles, Clock, MapPin, Eye,
} from "lucide-react";
import { communityDirectoryService } from "../../../services/community/communityDirectoryService";
import { whoToCallService } from "../../../services/community/whoToCallService";
import { userService } from "../../../services/common/userService";
import { useAuth } from "../../../contexts/AuthContext";
import { confirmAction } from "../../../utils/AlertUtils";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import type {
  CommunityLeaderResponse,
  CommunityLeaderRequest,
  CommunityWhoToCallResponse,
  CommunityWhoToCallRequest,
  CommunityWhoToCallHistoryResponse,
  UserResponse,
} from "../../../types/api";

const DESIGNATIONS = [
  "President", "Vice President", "Secretary", "Joint Secretary", "Treasurer",
  "Sports Director", "Director", "Chairman", "Chairperson",
  "Cultural Head", "Maintenance Head", "Security Head", "Grievance Officer", "Member",
];

const DEFAULT_DEPARTMENTS = [
  "Maintenance & Repairs",
  "Security & Gate Passes",
  "Lift & Elevator Emergency",
  "Water & Electricity Helpdesk",
  "Financial & Accounts Office",
  "Sports & Amenities Booking",
  "Cultural & Events Committee",
  "Complaints & Grievance Cell",
  "Resident Welfare & Senior Support",
  "Housekeeping & Waste Management",
];

const DEPARTMENT_COLORS: Record<string, string> = {
  "Maintenance & Repairs": "text-orange-700 bg-orange-50 border-orange-200",
  "Security & Gate Passes": "text-red-700 bg-red-50 border-red-200",
  "Lift & Elevator Emergency": "text-rose-700 bg-rose-50 border-rose-200",
  "Water & Electricity Helpdesk": "text-amber-700 bg-amber-50 border-amber-200",
  "Financial & Accounts Office": "text-emerald-700 bg-emerald-50 border-emerald-200",
  "Sports & Amenities Booking": "text-sky-700 bg-sky-50 border-sky-200",
  "Cultural & Events Committee": "text-pink-700 bg-pink-50 border-pink-200",
  "Complaints & Grievance Cell": "text-cyan-700 bg-cyan-50 border-cyan-200",
  "Resident Welfare & Senior Support": "text-purple-700 bg-purple-50 border-purple-200",
  "Housekeeping & Waste Management": "text-teal-700 bg-teal-50 border-teal-200",
};

const emptyLeaderForm: CommunityLeaderRequest & { _userName?: string } = {
  userId: 0,
  designation: "",
  committee: "",
  contactPhone: "",
  contactEmail: "",
  displayOrder: 0,
};

const emptyWhoToCallForm: CommunityWhoToCallRequest & { _userName?: string } = {
  department: "",
  contactPerson: "",
  userId: undefined,
  phoneNumber: "",
  secondaryPhone: "",
  email: "",
  designation: "",
  availability: "24/7 Available",
  locationOrDesk: "",
  icon: "HelpCircle",
  color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  isEmergency: false,
  displayOrder: 0,
  isActive: true,
};

type ActiveTab = "leaders" | "who_to_call" | "history";

export function AdminDirectory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("who_to_call");

  // ── Leader Directory State ──
  const [leaders, setLeaders] = useState<CommunityLeaderResponse[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(true);
  const [leaderSearch, setLeaderSearch] = useState("");
  const [leaderModal, setLeaderModal] = useState<null | "create" | CommunityLeaderResponse>(null);
  const [leaderForm, setLeaderForm] = useState(emptyLeaderForm);
  const [leaderSaving, setLeaderSaving] = useState(false);
  const [deletingLeaderId, setDeletingLeaderId] = useState<number | null>(null);

  // ── Who to Call State ──
  const [whoToCallList, setWhoToCallList] = useState<CommunityWhoToCallResponse[]>([]);
  const [loadingWhoToCall, setLoadingWhoToCall] = useState(true);
  const [whoToCallSearch, setWhoToCallSearch] = useState("");
  const [whoToCallModal, setWhoToCallModal] = useState<null | "create" | CommunityWhoToCallResponse>(null);
  const [whoToCallForm, setWhoToCallForm] = useState(emptyWhoToCallForm);
  const [whoToCallSaving, setWhoToCallSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingWhoToCallId, setDeletingWhoToCallId] = useState<number | null>(null);

  // ── History Audit State ──
  const [historyList, setHistoryList] = useState<CommunityWhoToCallHistoryResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedContactHistory, setSelectedContactHistory] = useState<CommunityWhoToCallResponse | null>(null);
  const [contactHistoryModalList, setContactHistoryModalList] = useState<CommunityWhoToCallHistoryResponse[]>([]);
  const [loadingContactHistory, setLoadingContactHistory] = useState(false);

  // ── Designations State ──
  const [designations, setDesignations] = useState<string[]>(DESIGNATIONS);
  const [isAddingNewDesignation, setIsAddingNewDesignation] = useState(false);
  const [newDesignationName, setNewDesignationName] = useState("");
  const [addingDesignationSaving, setAddingDesignationSaving] = useState(false);

  // ── User Auto-complete / Search Picker ──
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserResponse[]>([]);
  const [userSearching, setUserSearching] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Loaders ──
  const loadDesignations = useCallback(async () => {
    try {
      const res = await communityDirectoryService.getDesignations();
      if (Array.isArray(res) && res.length > 0) {
        const names = res.map((d) => (typeof d === "string" ? d : d.name)).filter(Boolean);
        setDesignations(Array.from(new Set([...names, ...DESIGNATIONS])));
      }
    } catch (err) {
      console.error("Failed to load designations:", err);
    }
  }, []);

  const loadLeaders = useCallback(async () => {
    setLoadingLeaders(true);
    try {
      const list = await communityDirectoryService.getDirectory();
      setLeaders(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error("Failed to load leaders:", err);
    } finally {
      setLoadingLeaders(false);
    }
  }, []);

  const loadWhoToCall = useCallback(async () => {
    setLoadingWhoToCall(true);
    try {
      const list = await whoToCallService.getAllWhoToCallList();
      setWhoToCallList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error("Failed to load Who to Call list:", err);
    } finally {
      setLoadingWhoToCall(false);
    }
  }, []);

  const loadCommunityHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const list = await whoToCallService.getCommunityHistory();
      setHistoryList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error("Failed to load community history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadLeaders();
    loadWhoToCall();
    loadDesignations();
  }, [loadLeaders, loadWhoToCall, loadDesignations]);

  useEffect(() => {
    if (activeTab === "history") {
      loadCommunityHistory();
    }
  }, [activeTab, loadCommunityHistory]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchForUsers = (q: string) => {
    setUserQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim() || !user?.communityId) {
      setUserResults([]);
      setShowUserDropdown(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setUserSearching(true);
      try {
        const res = await userService.searchUsers(user.communityId!, q.trim());
        setUserResults(Array.isArray(res) ? res : []);
        setShowUserDropdown(true);
      } catch {
        setUserResults([]);
      } finally {
        setUserSearching(false);
      }
    }, 300);
  };

  // ── User Selection Handlers ──
  const selectUserForLeader = (u: UserResponse) => {
    setLeaderForm({
      ...leaderForm,
      userId: u.id,
      _userName: u.fullName,
      contactPhone: u.phone || leaderForm.contactPhone,
      contactEmail: u.email || leaderForm.contactEmail,
    });
    setUserQuery(u.fullName);
    setShowUserDropdown(false);
  };

  const selectUserForWhoToCall = (u: UserResponse) => {
    setWhoToCallForm({
      ...whoToCallForm,
      userId: u.id,
      contactPerson: u.fullName,
      _userName: u.fullName,
      phoneNumber: u.phone || whoToCallForm.phoneNumber,
      email: u.email || whoToCallForm.email,
      designation: u.role || whoToCallForm.designation,
    });
    setUserQuery(u.fullName);
    setShowUserDropdown(false);
  };

  // ── Leader Modal Handlers ──
  const openCreateLeader = () => {
    setLeaderForm({ ...emptyLeaderForm });
    setUserQuery("");
    setIsAddingNewDesignation(false);
    setNewDesignationName("");
    setLeaderModal("create");
  };

  const openEditLeader = (l: CommunityLeaderResponse) => {
    setLeaderForm({
      userId: l.userId,
      designation: l.designation,
      committee: l.committee || "",
      contactPhone: l.contactPhone || "",
      contactEmail: l.contactEmail || "",
      displayOrder: l.displayOrder,
      _userName: l.fullName,
    });
    setUserQuery(l.fullName);
    setIsAddingNewDesignation(false);
    setNewDesignationName("");
    setLeaderModal(l);
  };

  const handleLeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderForm.userId || !leaderForm.designation.trim()) {
      showError("User and designation are required");
      return;
    }
    setLeaderSaving(true);
    try {
      const payload: CommunityLeaderRequest = {
        userId: leaderForm.userId,
        designation: leaderForm.designation.trim(),
        committee: leaderForm.committee?.trim() || undefined,
        contactPhone: leaderForm.contactPhone?.trim() || undefined,
        contactEmail: leaderForm.contactEmail?.trim() || undefined,
        displayOrder: Number(leaderForm.displayOrder) || 0,
      };
      if (leaderModal === "create") {
        await communityDirectoryService.addLeader(payload);
        showSuccess("Leader added to directory");
      } else if (typeof leaderModal === "object" && leaderModal !== null) {
        await communityDirectoryService.updateLeader(leaderModal.id, payload);
        showSuccess("Leader details updated");
      }
      setLeaderModal(null);
      await loadLeaders();
    } catch (err: any) {
      showError(err?.message || "Failed to save leader");
    } finally {
      setLeaderSaving(false);
    }
  };

  const handleDeleteLeader = async (l: CommunityLeaderResponse) => {
    const ok = await confirmAction({
      title: "Remove Directory Leader?",
      text: `Remove "${l.fullName}" (${l.designation}) from the directory?`,
      confirmButtonText: "Remove Leader",
    });
    if (!ok) return;
    setDeletingLeaderId(l.id);
    try {
      await communityDirectoryService.removeLeader(l.id);
      showSuccess(`${l.fullName} removed from directory`);
      await loadLeaders();
    } catch (err: any) {
      showError(err?.message || "Failed to remove leader");
    } finally {
      setDeletingLeaderId(null);
    }
  };

  // ── Who to Call Modal Handlers ──
  const openCreateWhoToCall = () => {
    setWhoToCallForm({ ...emptyWhoToCallForm });
    setUserQuery("");
    setWhoToCallModal("create");
  };

  const openEditWhoToCall = (c: CommunityWhoToCallResponse) => {
    setWhoToCallForm({
      department: c.department,
      contactPerson: c.contactPerson,
      userId: c.userId,
      phoneNumber: c.phoneNumber,
      secondaryPhone: c.secondaryPhone || "",
      email: c.email || "",
      designation: c.designation || "",
      availability: c.availability || "24/7 Available",
      locationOrDesk: c.locationOrDesk || "",
      icon: c.icon || "HelpCircle",
      color: c.color || DEPARTMENT_COLORS[c.department] || "text-indigo-600 bg-indigo-50 border-indigo-200",
      isEmergency: Boolean(c.isEmergency),
      displayOrder: c.displayOrder || 0,
      isActive: c.isActive,
      _userName: c.contactPerson,
    });
    setUserQuery(c.contactPerson);
    setWhoToCallModal(c);
  };

  const handleWhoToCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whoToCallForm.department.trim() || !whoToCallForm.contactPerson.trim() || !whoToCallForm.phoneNumber.trim()) {
      showError("Department, Contact Person, and Phone Number are required");
      return;
    }
    setWhoToCallSaving(true);
    try {
      const selectedColor = DEPARTMENT_COLORS[whoToCallForm.department.trim()] || whoToCallForm.color;
      const payload: CommunityWhoToCallRequest = {
        department: whoToCallForm.department.trim(),
        contactPerson: whoToCallForm.contactPerson.trim(),
        userId: whoToCallForm.userId,
        phoneNumber: whoToCallForm.phoneNumber.trim(),
        secondaryPhone: whoToCallForm.secondaryPhone?.trim() || undefined,
        email: whoToCallForm.email?.trim() || undefined,
        designation: whoToCallForm.designation?.trim() || undefined,
        availability: whoToCallForm.availability?.trim() || "24/7 Available",
        locationOrDesk: whoToCallForm.locationOrDesk?.trim() || undefined,
        icon: whoToCallForm.icon || "HelpCircle",
        color: selectedColor,
        isEmergency: Boolean(whoToCallForm.isEmergency),
        displayOrder: Number(whoToCallForm.displayOrder) || 0,
        isActive: whoToCallForm.isActive ?? true,
      };

      if (whoToCallModal === "create") {
        await whoToCallService.createWhoToCall(payload);
        showSuccess(`Added contact for "${payload.department}" and logged in history`);
      } else if (typeof whoToCallModal === "object" && whoToCallModal !== null) {
        await whoToCallService.updateWhoToCall(whoToCallModal.id, payload);
        showSuccess(`Updated "${payload.department}" contact and recorded changes in history`);
      }
      setWhoToCallModal(null);
      await loadWhoToCall();
      if (activeTab === "history") await loadCommunityHistory();
    } catch (err: any) {
      showError(err?.message || "Failed to save Who to Call contact");
    } finally {
      setWhoToCallSaving(false);
    }
  };

  const handleToggleWhoToCallStatus = async (c: CommunityWhoToCallResponse) => {
    setTogglingId(c.id);
    try {
      await whoToCallService.toggleStatus(c.id);
      showSuccess(`${c.department} marked as ${c.isActive ? "Inactive" : "Active"}`);
      await loadWhoToCall();
      if (activeTab === "history") await loadCommunityHistory();
    } catch (err: any) {
      showError(err?.message || "Failed to toggle status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteWhoToCall = async (c: CommunityWhoToCallResponse) => {
    const ok = await confirmAction({
      title: "Remove Who to Call Contact?",
      text: `Deactivate "${c.department}" (${c.contactPerson})? This action will be logged in history.`,
      confirmButtonText: "Deactivate Contact",
    });
    if (!ok) return;
    setDeletingWhoToCallId(c.id);
    try {
      await whoToCallService.deleteWhoToCall(c.id);
      showSuccess(`Deactivated "${c.department}" contact`);
      await loadWhoToCall();
      if (activeTab === "history") await loadCommunityHistory();
    } catch (err: any) {
      showError(err?.message || "Failed to delete contact");
    } finally {
      setDeletingWhoToCallId(null);
    }
  };

  const openContactHistory = async (c: CommunityWhoToCallResponse) => {
    setSelectedContactHistory(c);
    setLoadingContactHistory(true);
    try {
      const list = await whoToCallService.getContactHistory(c.id);
      setContactHistoryModalList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      showError(err?.message || "Failed to load contact history");
    } finally {
      setLoadingContactHistory(false);
    }
  };

  const handleAddNewDesignation = async () => {
    const trimmed = newDesignationName.trim();
    if (!trimmed) {
      showError("Please enter a designation name");
      return;
    }
    setAddingDesignationSaving(true);
    try {
      const res = await communityDirectoryService.addDesignation(trimmed);
      const savedName = res?.name || trimmed;
      setDesignations((prev) => Array.from(new Set([...prev, savedName])));
      setLeaderForm((prev) => ({ ...prev, designation: savedName }));
      showSuccess(`Added official designation "${savedName}"`);
      setIsAddingNewDesignation(false);
      setNewDesignationName("");
    } catch (err: any) {
      showError(err?.message || "Failed to add designation");
    } finally {
      setAddingDesignationSaving(false);
    }
  };

  // ── Filters ──
  const filteredLeaders = leaders.filter((l) => {
    const q = leaderSearch.toLowerCase();
    return (
      l.fullName.toLowerCase().includes(q) ||
      l.designation.toLowerCase().includes(q) ||
      (l.committee && l.committee.toLowerCase().includes(q))
    );
  });

  const filteredWhoToCall = whoToCallList.filter((c) => {
    const q = whoToCallSearch.toLowerCase();
    return (
      c.department.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.phoneNumber.toLowerCase().includes(q) ||
      (c.designation && c.designation.toLowerCase().includes(q)) ||
      (c.locationOrDesk && c.locationOrDesk.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 w-full pb-12" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white/70 backdrop-blur-md border border-slate-200/70 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 rounded-2xl shadow-md text-white flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
              <span>Admin Hub</span>
              <span>/</span>
              <span>Community Directory & Who to Call</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-0.5">
              Directory & Department Contacts
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Manage executive leaders, emergency contacts, Who to Call departments, and view audit history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "who_to_call" && (
            <button
              onClick={openCreateWhoToCall}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              <Plus className="w-4 h-4" /> Add Who to Call
            </button>
          )}
          {activeTab === "leaders" && (
            <button
              onClick={openCreateLeader}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              <Plus className="w-4 h-4" /> Add Leader
            </button>
          )}
        </div>
      </div>

      {/* ── Sub-Tabs Strip ── */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab("who_to_call")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "who_to_call"
              ? "bg-white text-indigo-700 shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Phone className="w-4 h-4 text-indigo-600" />
          <span>Who to Call Directory</span>
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold">
            {whoToCallList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("leaders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "leaders"
              ? "bg-white text-indigo-700 shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 text-violet-600" />
          <span>Council & Committee Leaders</span>
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-extrabold">
            {leaders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-white text-indigo-700 shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <History className="w-4 h-4 text-emerald-600" />
          <span>Change History Audit Log</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 1: WHO TO CALL DIRECTORY ───────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "who_to_call" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                value={whoToCallSearch}
                onChange={(e) => setWhoToCallSearch(e.target.value)}
                placeholder="Search department, contact person, phone..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredWhoToCall.length}</span> of{" "}
              <span className="font-bold text-slate-900">{whoToCallList.length}</span> Who to Call contacts
            </div>
          </div>

          {loadingWhoToCall ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/60 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
              <span className="text-xs font-semibold text-slate-500">Loading Who to Call directory...</span>
            </div>
          ) : filteredWhoToCall.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200/70 rounded-2xl p-6">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-600" />
              <p className="text-sm text-slate-700 font-bold">
                {whoToCallSearch ? "No contacts match your search" : "No Who to Call contacts added yet"}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Add contacts for departments like Maintenance, Security, Lift Emergency, Accounts, etc.
              </p>
              {!whoToCallSearch && (
                <button
                  onClick={openCreateWhoToCall}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add First Department Contact
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWhoToCall.map((c) => {
                const colorClass = DEPARTMENT_COLORS[c.department] || c.color || "text-indigo-600 bg-indigo-50 border-indigo-200";
                return (
                  <div
                    key={c.id}
                    className={`bg-white rounded-2xl border transition-all p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-md ${
                      !c.isActive ? "opacity-60 border-dashed border-slate-300" : "border-slate-200/80"
                    }`}
                  >
                    <div>
                      {/* Department header badge & emergency indicator */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-2 rounded-xl border text-xs font-black shrink-0 ${colorClass}`}>
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">{c.department}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {c.isEmergency && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200 shrink-0">
                                  <AlertTriangle className="w-3 h-3" /> Emergency
                                </span>
                              )}
                              <span className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {c.availability || "24/7 Available"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {/* Contact person & location info */}
                      <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1.5 my-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{c.contactPerson}</span>
                          {c.designation && (
                            <span className="text-[11px] text-slate-500 font-medium">({c.designation})</span>
                          )}
                        </div>
                        {c.locationOrDesk && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{c.locationOrDesk}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 text-slate-700 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="font-semibold">{c.phoneNumber}</span>
                          {c.secondaryPhone && (
                            <span className="text-slate-400">/ {c.secondaryPhone}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Strip */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => openContactHistory(c)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors"
                        title="View change history log"
                      >
                        <History className="w-3.5 h-3.5" /> History
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleWhoToCallStatus(c)}
                          disabled={togglingId === c.id}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            c.isActive
                              ? "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          }`}
                          title={c.isActive ? "Deactivate" : "Activate"}
                        >
                          {togglingId === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : c.isActive ? (
                            <RotateCcw className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditWhoToCall(c)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 transition-colors cursor-pointer"
                          title="Edit contact"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteWhoToCall(c)}
                          disabled={deletingWhoToCallId === c.id}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 transition-colors cursor-pointer"
                          title="Remove contact"
                        >
                          {deletingWhoToCallId === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 2: COUNCIL & DIRECTORY LEADERS ──────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "leaders" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                value={leaderSearch}
                onChange={(e) => setLeaderSearch(e.target.value)}
                placeholder="Search leaders by name, designation..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredLeaders.length}</span> of{" "}
              <span className="font-bold text-slate-900">{leaders.length}</span> directory leaders
            </div>
          </div>

          {loadingLeaders ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/60 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
              <span className="text-xs font-semibold text-slate-500">Loading directory leaders...</span>
            </div>
          ) : filteredLeaders.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200/70 rounded-2xl p-6">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-600" />
              <p className="text-sm text-slate-700 font-bold">
                {leaderSearch ? "No directory leaders match your search" : "No leaders added yet"}
              </p>
              {!leaderSearch && (
                <button
                  onClick={openCreateLeader}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Directory Leader
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-5 py-3.5">
                        <div className="flex items-center gap-1"><ArrowUpDown className="w-3.5 h-3.5" /> Order</div>
                      </th>
                      <th className="px-5 py-3.5">Member Name</th>
                      <th className="px-5 py-3.5">Designation</th>
                      <th className="px-5 py-3.5 hidden md:table-cell">Committee Group</th>
                      <th className="px-5 py-3.5 hidden lg:table-cell">Contact Details</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredLeaders.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4 font-mono text-slate-400 font-bold">#{l.displayOrder}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {l.profilePicUrl ? (
                              <img src={l.profilePicUrl} alt={l.fullName} className="w-9 h-9 rounded-xl object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                {l.fullName[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 text-xs sm:text-sm">{l.fullName}</p>
                              {(l.flatNo || l.block) && (
                                <p className="text-[11px] text-slate-500">Unit: {l.block} {l.flatNo}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            {l.designation}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell text-xs text-slate-600">
                          {l.committee || <span className="text-slate-400 italic">—</span>}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell space-y-0.5 text-xs text-slate-600">
                          {l.contactPhone && (
                            <div className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-emerald-600" /> {l.contactPhone}
                            </div>
                          )}
                          {l.contactEmail && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Mail className="w-3 h-3 text-indigo-600" /> {l.contactEmail}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditLeader(l)}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                              title="Edit leader"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLeader(l)}
                              disabled={deletingLeaderId === l.id}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                              title="Remove leader"
                            >
                              {deletingLeaderId === l.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 3: CHANGE HISTORY AUDIT LOG ────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              Who to Call Audit History
            </h3>
            <button
              onClick={loadCommunityHistory}
              className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/60 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
              <span className="text-xs font-semibold text-slate-500">Loading audit history...</span>
            </div>
          ) : historyList.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200/70 rounded-2xl p-6">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
              <p className="text-sm text-slate-700 font-bold">No history recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Changes to Who to Call contacts will be tracked and displayed here.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {historyList.map((h) => (
                  <div key={h.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl text-xs font-bold shrink-0 mt-0.5 ${
                          h.action === "CREATED"
                            ? "bg-emerald-100 text-emerald-800"
                            : h.action === "UPDATED"
                            ? "bg-indigo-100 text-indigo-800"
                            : h.action === "RESTORED"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {h.action}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900">{h.department}</span>
                          <span className="text-xs text-slate-500 font-medium">({h.contactPerson} - {h.phoneNumber})</span>
                        </div>
                        {h.changeSummary && (
                          <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 border border-slate-100">
                            {h.changeSummary}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400">
                          Modified by <span className="font-bold text-slate-700">{h.changedByName || "Admin"}</span> •{" "}
                          {new Date(h.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL: ADD / EDIT WHO TO CALL CONTACT ───────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {whoToCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {whoToCallModal === "create" ? "Add Who to Call Contact" : "Edit Who to Call Contact"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Saves to the community directory and logs change history.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhoToCallModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWhoToCallSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Department / Issue Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Department / Service Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="departments-list"
                  value={whoToCallForm.department}
                  onChange={(e) => setWhoToCallForm({ ...whoToCallForm, department: e.target.value })}
                  placeholder="e.g. Maintenance & Repairs, Lift Emergency..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                />
                <datalist id="departments-list">
                  {DEFAULT_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} />
                  ))}
                </datalist>
              </div>

              {/* Link to Community User (Optional with Auto-fill) */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Pick Community User (Auto-fills details)</span>
                  <span className="text-[10px] text-indigo-600 font-normal">Optional</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => searchForUsers(e.target.value)}
                    placeholder="Search member by name to link..."
                    className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                  {userSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-600" />}
                </div>

                {showUserDropdown && userResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-48 overflow-y-auto z-30 divide-y divide-slate-100">
                    {userResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => selectUserForWhoToCall(u)}
                        className="p-3 hover:bg-indigo-50/70 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-xs text-slate-900">{u.fullName}</p>
                          <p className="text-[10px] text-slate-500">{u.email} • {u.phone}</p>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Person Name & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Contact Person / Lead <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={whoToCallForm.contactPerson}
                    onChange={(e) => setWhoToCallForm({ ...whoToCallForm, contactPerson: e.target.value })}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    value={whoToCallForm.designation}
                    onChange={(e) => setWhoToCallForm({ ...whoToCallForm, designation: e.target.value })}
                    placeholder="e.g. Maintenance Head, Security In-Charge"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Phone & Secondary Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Primary Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={whoToCallForm.phoneNumber}
                    onChange={(e) => setWhoToCallForm({ ...whoToCallForm, phoneNumber: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Secondary Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={whoToCallForm.secondaryPhone}
                    onChange={(e) => setWhoToCallForm({ ...whoToCallForm, secondaryPhone: e.target.value })}
                    placeholder="e.g. 040-2345678"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Availability & Desk / Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Availability / Working Hours
                  </label>
                  <input
                    type="text"
                    value={whoToCallForm.availability}
                    onChange={(e) => setWhoToCallForm({ ...whoToCallForm, availability: e.target.value })}
                    placeholder="e.g. 24/7 Available, 9 AM - 6 PM"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Desk / Office Location
                  </label>
                  <input
                    type="text"
                    value={whoToCallForm.locationOrDesk}
                    onChange={(e) => setWhoToCallForm({ ...whoToCallForm, locationOrDesk: e.target.value })}
                    placeholder="e.g. Main Gate Security Cabin, Clubhouse"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Email & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={whoToCallForm.email}
                    onChange={(e) => setWhoToCallForm({ ...whoToCallForm, email: e.target.value })}
                    placeholder="e.g. maintenance@society.com"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={whoToCallForm.displayOrder}
                    onChange={(e) => setWhoToCallForm({ ...whoToCallForm, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Emergency Checkbox */}
              <div className="flex items-center gap-3 p-3 bg-red-50/70 border border-red-200/80 rounded-2xl">
                <input
                  type="checkbox"
                  id="isEmergency"
                  checked={whoToCallForm.isEmergency}
                  onChange={(e) => setWhoToCallForm({ ...whoToCallForm, isEmergency: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded-md focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="isEmergency" className="text-xs font-bold text-red-900 cursor-pointer">
                  Mark as Emergency Contact (Highlighted prominently for residents)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWhoToCallModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={whoToCallSaving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {whoToCallSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {whoToCallModal === "create" ? "Save to Directory & History" : "Update & Record History"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL: ADD / EDIT DIRECTORY LEADER ──────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {leaderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="font-black text-lg text-slate-900">
                {leaderModal === "create" ? "Add Directory Leader" : "Edit Directory Leader"}
              </h3>
              <button
                type="button"
                onClick={() => setLeaderModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLeaderSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Member Auto-complete */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Community Member <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => searchForUsers(e.target.value)}
                    placeholder="Search member by name..."
                    className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                  {userSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-600" />}
                </div>

                {showUserDropdown && userResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-48 overflow-y-auto z-30 divide-y divide-slate-100">
                    {userResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => selectUserForLeader(u)}
                        className="p-3 hover:bg-indigo-50/70 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-xs text-slate-900">{u.fullName}</p>
                          <p className="text-[10px] text-slate-500">{u.email} • {u.phone}</p>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Designation Select / Add */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Official Designation <span className="text-red-500">*</span>
                  </label>
                  {!isAddingNewDesignation && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewDesignation(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      + Add New
                    </button>
                  )}
                </div>

                {isAddingNewDesignation ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDesignationName}
                      onChange={(e) => setNewDesignationName(e.target.value)}
                      placeholder="Type new designation name..."
                      className="flex-1 px-3 py-2 border border-indigo-300 rounded-xl text-slate-800 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewDesignation}
                      disabled={addingDesignationSaving}
                      className="px-3 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs"
                    >
                      {addingDesignationSaving ? "..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewDesignation(false)}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <select
                    value={leaderForm.designation}
                    onChange={(e) => setLeaderForm({ ...leaderForm, designation: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="">-- Select Designation --</option>
                    {designations.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Committee Group */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Committee Group</label>
                <input
                  type="text"
                  value={leaderForm.committee}
                  onChange={(e) => setLeaderForm({ ...leaderForm, committee: e.target.value })}
                  placeholder="e.g. Maintenance, Cultural, Sports..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Phone</label>
                  <input
                    type="tel"
                    value={leaderForm.contactPhone}
                    onChange={(e) => setLeaderForm({ ...leaderForm, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    value={leaderForm.contactEmail}
                    onChange={(e) => setLeaderForm({ ...leaderForm, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Order</label>
                <input
                  type="number"
                  value={leaderForm.displayOrder}
                  onChange={(e) => setLeaderForm({ ...leaderForm, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLeaderModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={leaderSaving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {leaderSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {leaderModal === "create" ? "Add Leader" : "Update Leader"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL: SINGLE CONTACT HISTORY VIEW ──────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedContactHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  History: {selectedContactHistory.department}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedContactHistory.contactPerson} • {selectedContactHistory.phoneNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContactHistory(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingContactHistory ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                <span className="text-xs font-semibold">Loading history events...</span>
              </div>
            ) : contactHistoryModalList.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs font-semibold">
                No change history recorded for this contact.
              </div>
            ) : (
              <div className="space-y-3">
                {contactHistoryModalList.map((h) => (
                  <div key={h.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          h.action === "CREATED"
                            ? "bg-emerald-100 text-emerald-800"
                            : h.action === "UPDATED"
                            ? "bg-indigo-100 text-indigo-800"
                            : h.action === "RESTORED"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {h.action}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {h.changeSummary && (
                      <p className="text-slate-700 font-medium pt-1">{h.changeSummary}</p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Author: <span className="font-bold text-slate-600">{h.changedByName || "Admin"}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
