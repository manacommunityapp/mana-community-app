import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Shield, Plus, Pencil, Trash2, X, Search, Inbox, Loader2,
  Phone, Mail, ArrowUpDown, Users, AlertTriangle,
  History, CheckCircle2, RotateCcw, Wrench,
  Building2, Sparkles, Clock, MapPin, Eye, Landmark, Crown, Award, ArrowRight,
  MoreVertical, ChevronDown,
} from "lucide-react";
import { communityDirectoryService } from "../../../services/community/communityDirectoryService";
import { whoToCallService } from "../../../services/community/whoToCallService";
import { committeeGroupService } from "../../../services/community/committeeGroupService";
import { userService } from "../../../services/common/userService";
import { useAuth } from "../../../contexts/AuthContext";
import { confirmAction } from "../../../utils/AlertUtils";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import type {
  CommunityLeaderResponse,
  CommunityLeaderRequest,
  CommunityLeaderHistoryResponse,
  CommunityWhoToCallResponse,
  CommunityWhoToCallRequest,
  CommunityWhoToCallHistoryResponse,
  UserResponse,
  CommitteeGroupResponse,
  CommitteeGroupRequest,
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

type ActiveTab = "leaders" | "who_to_call" | "committee_groups" | "history";
type HistoryFilter = "all" | "leaders" | "who_to_call";

export function AdminDirectory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("leaders");

  // ── Leader Directory State ──
  const [leaders, setLeaders] = useState<CommunityLeaderResponse[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(true);
  const [leaderSearch, setLeaderSearch] = useState("");
  const [leaderModal, setLeaderModal] = useState<null | "create" | CommunityLeaderResponse>(null);
  const [leaderForm, setLeaderForm] = useState(emptyLeaderForm);
  const [leaderSaving, setLeaderSaving] = useState(false);
  const [deletingLeaderId, setDeletingLeaderId] = useState<number | null>(null);

  // ── Single Leader History Modal State ──
  const [selectedLeaderHistory, setSelectedLeaderHistory] = useState<CommunityLeaderResponse | null>(null);
  const [leaderHistoryModalList, setLeaderHistoryModalList] = useState<CommunityLeaderHistoryResponse[]>([]);
  const [loadingSingleLeaderHistory, setLoadingSingleLeaderHistory] = useState(false);

  // ── Who to Call State ──
  const [whoToCallList, setWhoToCallList] = useState<CommunityWhoToCallResponse[]>([]);
  const [loadingWhoToCall, setLoadingWhoToCall] = useState(true);
  const [whoToCallSearch, setWhoToCallSearch] = useState("");
  const [whoToCallModal, setWhoToCallModal] = useState<null | "create" | CommunityWhoToCallResponse>(null);
  const [whoToCallForm, setWhoToCallForm] = useState(emptyWhoToCallForm);
  const [whoToCallSaving, setWhoToCallSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingWhoToCallId, setDeletingWhoToCallId] = useState<number | null>(null);

  // ── Single Contact History Modal State ──
  const [selectedContactHistory, setSelectedContactHistory] = useState<CommunityWhoToCallResponse | null>(null);
  const [contactHistoryModalList, setContactHistoryModalList] = useState<CommunityWhoToCallHistoryResponse[]>([]);
  const [loadingContactHistory, setLoadingContactHistory] = useState(false);

  // ── Committee Group State ──
  const [committeeGroups, setCommitteeGroups] = useState<CommitteeGroupResponse[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupModal, setGroupModal] = useState<null | "create" | CommitteeGroupResponse>(null);
  const [groupForm, setGroupForm] = useState<CommitteeGroupRequest>({ name: "", description: "", displayOrder: 0 });
  const [groupSaving, setGroupSaving] = useState(false);
  const [togglingGroupId, setTogglingGroupId] = useState<number | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);

  // ── History Tab State (Combined Leaders & Who to Call) ──
  const [historyList, setHistoryList] = useState<CommunityWhoToCallHistoryResponse[]>([]);
  const [leaderHistoryList, setLeaderHistoryList] = useState<CommunityLeaderHistoryResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [historySearch, setHistorySearch] = useState("");

  // ── Designations State ──
  const [designations, setDesignations] = useState<string[]>(DESIGNATIONS);
  const [isAddingNewDesignation, setIsAddingNewDesignation] = useState(false);
  const [newDesignationName, setNewDesignationName] = useState("");
  const [addingDesignationSaving, setAddingDesignationSaving] = useState(false);

  // ── Inline Committee Group Add State (in Leader Modal) ──
  const [isAddingNewGroup, setIsAddingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [addingGroupSaving, setAddingGroupSaving] = useState(false);

  // ── User Auto-complete / Search Picker ──
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserResponse[]>([]);
  const [userSearching, setUserSearching] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Loaders ──
  const loadCommitteeGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const list = await committeeGroupService.getAll();
      setCommitteeGroups(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error("Failed to load committee groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

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

  const loadAllHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const [whoRes, leaderRes] = await Promise.allSettled([
        whoToCallService.getCommunityHistory(),
        communityDirectoryService.getLeaderHistory(),
      ]);

      if (whoRes.status === "fulfilled" && Array.isArray(whoRes.value)) {
        setHistoryList(whoRes.value);
      }
      if (leaderRes.status === "fulfilled" && Array.isArray(leaderRes.value)) {
        setLeaderHistoryList(leaderRes.value);
      }
    } catch (err: any) {
      console.error("Failed to load community history audit log:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadLeaders();
    loadWhoToCall();
    loadDesignations();
    loadCommitteeGroups();
  }, [loadLeaders, loadWhoToCall, loadDesignations, loadCommitteeGroups]);

  useEffect(() => {
    if (activeTab === "history") {
      loadAllHistory();
    }
  }, [activeTab, loadAllHistory]);

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
    setIsAddingNewGroup(false);
    setNewGroupName("");
    setNewGroupDescription("");
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
    setIsAddingNewGroup(false);
    setNewGroupName("");
    setNewGroupDescription("");
    setLeaderModal(l);
  };

  const openLeaderHistory = async (l: CommunityLeaderResponse) => {
    setSelectedLeaderHistory(l);
    setLoadingSingleLeaderHistory(true);
    try {
      const list = await communityDirectoryService.getLeaderHistory(l.id);
      setLeaderHistoryModalList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      showError(err?.message || "Failed to load leader history");
    } finally {
      setLoadingSingleLeaderHistory(false);
    }
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
        const created = await communityDirectoryService.addLeader(payload);
        await communityDirectoryService.recordLeaderHistory({
          leaderId: created?.id,
          userId: payload.userId,
          fullName: leaderForm._userName || "Council Leader",
          designation: payload.designation,
          committee: payload.committee,
          contactPhone: payload.contactPhone,
          contactEmail: payload.contactEmail,
          action: "APPOINTED",
          changeSummary: `Appointed as ${payload.designation}${payload.committee ? " (" + payload.committee + ")" : ""}`,
        });
        showSuccess("Leader added to directory and recorded in history");
      } else if (typeof leaderModal === "object" && leaderModal !== null) {
        await communityDirectoryService.updateLeader(leaderModal.id, payload);
        const changes: string[] = [];
        if (leaderModal.designation !== payload.designation) {
          changes.push(`Designation updated from "${leaderModal.designation}" to "${payload.designation}"`);
        }
        if ((leaderModal.committee || "") !== (payload.committee || "")) {
          changes.push(`Committee updated to "${payload.committee || "None"}"`);
        }
        if ((leaderModal.contactPhone || "") !== (payload.contactPhone || "")) {
          changes.push(`Contact phone updated to "${payload.contactPhone || "None"}"`);
        }
        if ((leaderModal.contactEmail || "") !== (payload.contactEmail || "")) {
          changes.push(`Contact email updated to "${payload.contactEmail || "None"}"`);
        }
        const summary = changes.length > 0 ? changes.join("; ") : `Updated council profile for ${leaderModal.fullName}`;

        await communityDirectoryService.recordLeaderHistory({
          leaderId: leaderModal.id,
          userId: payload.userId,
          fullName: leaderModal.fullName,
          designation: payload.designation,
          previousDesignation: leaderModal.designation,
          committee: payload.committee,
          previousCommittee: leaderModal.committee,
          contactPhone: payload.contactPhone,
          contactEmail: payload.contactEmail,
          action: "UPDATED",
          changeSummary: summary,
        });
        showSuccess("Leader details updated and logged in history");
      }
      setLeaderModal(null);
      await loadLeaders();
      if (activeTab === "history") await loadAllHistory();
    } catch (err: any) {
      showError(err?.message || "Failed to save leader");
    } finally {
      setLeaderSaving(false);
    }
  };

  const handleDeleteLeader = async (l: CommunityLeaderResponse) => {
    const ok = await confirmAction({
      title: "Remove Directory Leader?",
      text: `Relieve "${l.fullName}" from the position of ${l.designation}? This change will be permanently logged in history.`,
      confirmButtonText: "Remove & Log in History",
    });
    if (!ok) return;
    setDeletingLeaderId(l.id);
    try {
      await communityDirectoryService.removeLeader(l.id);
      await communityDirectoryService.recordLeaderHistory({
        leaderId: l.id,
        userId: l.userId,
        fullName: l.fullName,
        designation: l.designation,
        committee: l.committee,
        contactPhone: l.contactPhone,
        contactEmail: l.contactEmail,
        action: "REMOVED",
        changeSummary: `Relieved from Council position of ${l.designation}${l.committee ? " (" + l.committee + ")" : ""}`,
      });
      showSuccess(`${l.fullName} removed and logged in history`);
      await loadLeaders();
      if (activeTab === "history") await loadAllHistory();
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
      if (activeTab === "history") await loadAllHistory();
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
      if (activeTab === "history") await loadAllHistory();
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
      if (activeTab === "history") await loadAllHistory();
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

  const handleAddNewGroup = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) {
      showError("Please enter a committee group name");
      return;
    }
    setAddingGroupSaving(true);
    try {
      const newGroup = await committeeGroupService.create({
        name: trimmed,
        description: newGroupDescription.trim() || undefined,
        displayOrder: committeeGroups.length + 1,
      });
      setCommitteeGroups((prev) => [...prev, newGroup]);
      setLeaderForm((prev) => ({ ...prev, committee: newGroup.name }));
      showSuccess(`Saved committee group "${newGroup.name}" to database`);
      setIsAddingNewGroup(false);
      setNewGroupName("");
      setNewGroupDescription("");
    } catch (err: any) {
      showError(err?.message || "Failed to add committee group");
    } finally {
      setAddingGroupSaving(false);
    }
  };

  // ── Committee Group Handlers ──
  const openCreateGroup = () => {
    setGroupForm({ name: "", description: "", displayOrder: 0 });
    setGroupModal("create");
  };

  const openEditGroup = (g: CommitteeGroupResponse) => {
    setGroupForm({ name: g.name, description: g.description || "", displayOrder: g.displayOrder });
    setGroupModal(g);
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim()) {
      showError("Committee group name is required");
      return;
    }
    setGroupSaving(true);
    try {
      const payload: CommitteeGroupRequest = {
        name: groupForm.name.trim(),
        description: groupForm.description?.trim() || undefined,
        displayOrder: Number(groupForm.displayOrder) || 0,
      };
      if (groupModal === "create") {
        await committeeGroupService.create(payload);
        showSuccess(`Committee group "${payload.name}" created successfully`);
      } else if (typeof groupModal === "object" && groupModal !== null) {
        await committeeGroupService.update(groupModal.id, payload);
        showSuccess(`Committee group "${payload.name}" updated successfully`);
      }
      setGroupModal(null);
      await loadCommitteeGroups();
    } catch (err: any) {
      showError(err?.message || "Failed to save committee group");
    } finally {
      setGroupSaving(false);
    }
  };

  const handleToggleGroupStatus = async (g: CommitteeGroupResponse) => {
    setTogglingGroupId(g.id);
    try {
      await committeeGroupService.toggleStatus(g.id);
      showSuccess(`"${g.name}" marked as ${g.isActive ? "Inactive" : "Active"}`);
      await loadCommitteeGroups();
    } catch (err: any) {
      showError(err?.message || "Failed to toggle status");
    } finally {
      setTogglingGroupId(null);
    }
  };

  const handleDeleteGroup = async (g: CommitteeGroupResponse) => {
    const ok = await confirmAction({
      title: "Delete Committee Group?",
      text: `Permanently delete "${g.name}"? This cannot be undone.`,
      confirmButtonText: "Delete",
    });
    if (!ok) return;
    setDeletingGroupId(g.id);
    try {
      await committeeGroupService.delete(g.id);
      showSuccess(`Committee group "${g.name}" deleted`);
      await loadCommitteeGroups();
    } catch (err: any) {
      showError(err?.message || "Failed to delete committee group");
    } finally {
      setDeletingGroupId(null);
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

  const filteredGroups = committeeGroups.filter((g) => {
    const q = groupSearch.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      (g.description && g.description.toLowerCase().includes(q))
    );
  });

  // ── Unified History Timeline ──
  const combinedHistory = useMemo(() => {
    type UnifiedHistoryItem =
      | { type: "who_to_call"; data: CommunityWhoToCallHistoryResponse; timestamp: number }
      | { type: "leader"; data: CommunityLeaderHistoryResponse; timestamp: number };

    const items: UnifiedHistoryItem[] = [];

    if (historyFilter === "all" || historyFilter === "who_to_call") {
      historyList.forEach((h) => {
        items.push({
          type: "who_to_call",
          data: h,
          timestamp: new Date(h.createdAt).getTime() || 0,
        });
      });
    }

    if (historyFilter === "all" || historyFilter === "leaders") {
      leaderHistoryList.forEach((h) => {
        items.push({
          type: "leader",
          data: h,
          timestamp: new Date(h.createdAt).getTime() || 0,
        });
      });
    }

    // Sort newest first
    items.sort((a, b) => b.timestamp - a.timestamp);

    if (!historySearch.trim()) return items;
    const q = historySearch.toLowerCase();
    return items.filter((it) => {
      if (it.type === "who_to_call") {
        return (
          it.data.department.toLowerCase().includes(q) ||
          it.data.contactPerson.toLowerCase().includes(q) ||
          it.data.action.toLowerCase().includes(q) ||
          (it.data.changeSummary && it.data.changeSummary.toLowerCase().includes(q)) ||
          (it.data.changedByName && it.data.changedByName.toLowerCase().includes(q))
        );
      } else {
        return (
          it.data.fullName.toLowerCase().includes(q) ||
          it.data.designation.toLowerCase().includes(q) ||
          (it.data.committee && it.data.committee.toLowerCase().includes(q)) ||
          it.data.action.toLowerCase().includes(q) ||
          (it.data.changeSummary && it.data.changeSummary.toLowerCase().includes(q)) ||
          (it.data.changedByName && it.data.changedByName.toLowerCase().includes(q))
        );
      }
    });
  }, [historyList, leaderHistoryList, historyFilter, historySearch]);

  return (
    <div className="space-y-3.5 sm:space-y-4 w-full pb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white/80 backdrop-blur-md border border-slate-200/80 p-3.5 sm:p-4 rounded-xl shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 rounded-xl shadow-2xs text-white shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              <span>Admin Hub</span>
              <span>/</span>
              <span>Directory &amp; Who to Call</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Directory &amp; Department Contacts
            </h2>
            <p className="text-slate-500 text-xs mt-0.5 line-clamp-1 sm:line-clamp-none">
              Manage council leadership, department helpdesk contacts, and audit change &amp; tenure history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "leaders" && (
            <button
              onClick={openCreateLeader}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Add Leader
            </button>
          )}
          {activeTab === "who_to_call" && (
            <button
              onClick={openCreateWhoToCall}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Add Who to Call
            </button>
          )}
          {activeTab === "committee_groups" && (
            <button
              onClick={openCreateGroup}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Add Group
            </button>
          )}
        </div>
      </div>

      {/* ── Sub-Tabs Strip (Horizontal Scroll on Mobile) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 sm:p-1.5 rounded-xl bg-slate-100/90 border border-slate-200/80 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("leaders")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "leaders"
              ? "bg-white text-indigo-700 shadow-2xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-violet-600" />
          <span>Council Leaders</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-extrabold">
            {leaders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("who_to_call")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "who_to_call"
              ? "bg-white text-indigo-700 shadow-2xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Phone className="w-3.5 h-3.5 text-indigo-600" />
          <span>Who to Call</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-extrabold">
            {whoToCallList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("committee_groups")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "committee_groups"
              ? "bg-white text-indigo-700 shadow-2xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Landmark className="w-3.5 h-3.5 text-amber-600" />
          <span>Committee Groups</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-extrabold">
            {committeeGroups.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-white text-indigo-700 shadow-2xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <History className="w-3.5 h-3.5 text-emerald-600" />
          <span>Audit Log</span>
          {(historyList.length > 0 || leaderHistoryList.length > 0) && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
              {historyList.length + leaderHistoryList.length}
            </span>
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 1: COUNCIL & DIRECTORY LEADERS ──────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "leaders" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                value={leaderSearch}
                onChange={(e) => setLeaderSearch(e.target.value)}
                placeholder="Search leaders by name, designation..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredLeaders.length}</span> of{" "}
              <span className="font-bold text-slate-900">{leaders.length}</span> leaders
            </div>
          </div>

          {loadingLeaders ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200/60 rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
              <span className="text-xs font-semibold text-slate-500">Loading directory leaders...</span>
            </div>
          ) : filteredLeaders.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200/70 rounded-xl p-4">
              <Inbox className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-600" />
              <p className="text-xs sm:text-sm text-slate-700 font-bold">
                {leaderSearch ? "No directory leaders match your search" : "No leaders added yet"}
              </p>
              {!leaderSearch && (
                <button
                  onClick={openCreateLeader}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Directory Leader
                </button>
              )}
            </div>
          ) : (
            <>
              {/* MOBILE CARDS VIEW (block on mobile, hidden on md+) */}
              <div className="grid grid-cols-1 gap-2.5 md:hidden">
                {filteredLeaders.map((l) => (
                  <div
                    key={l.id}
                    className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {l.profilePicUrl ? (
                          <img
                            src={l.profilePicUrl}
                            alt={l.fullName}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                              const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                              if (sibling) sibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0 ${
                            l.profilePicUrl ? "hidden" : "flex"
                          }`}
                        >
                          {l.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate tracking-tight">{l.fullName}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                              <Award className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                              <span>{l.designation}</span>
                            </span>
                            {(l.flatNo || l.block) && (
                              <span className="inline-flex items-center text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                Unit: {l.block} {l.flatNo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[10.5px] text-slate-400 font-bold shrink-0">
                        #{l.displayOrder}
                      </span>
                    </div>

                    {l.committee && (
                      <div className="text-[11px] text-slate-700 bg-amber-50/70 px-2.5 py-1 rounded-lg border border-amber-200/60 flex items-center gap-1.5 font-medium">
                        <Landmark className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">{l.committee}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono truncate">
                        {l.contactPhone && (
                          <a
                            href={`tel:${l.contactPhone}`}
                            className="flex items-center gap-1 text-emerald-600 font-bold hover:underline"
                          >
                            <Phone className="w-3 h-3" /> {l.contactPhone}
                          </a>
                        )}
                        {l.contactEmail && (
                          <a
                            href={`mailto:${l.contactEmail}`}
                            className="flex items-center gap-1 text-indigo-600 hover:underline"
                            title={l.contactEmail}
                          >
                            <Mail className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Mobile Direct Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openLeaderHistory(l)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer border border-emerald-200/60 active:scale-95 flex items-center justify-center"
                          title="View Council History & Tenure"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditLeader(l)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer border border-indigo-200/60 active:scale-95 flex items-center justify-center"
                          title="Edit Leader Details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLeader(l)}
                          disabled={deletingLeaderId === l.id}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer border border-rose-200/60 active:scale-95 disabled:opacity-50 flex items-center justify-center"
                          title="Remove Leader"
                        >
                          {deletingLeaderId === l.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW (hidden on mobile, block on md+) */}
              <div className="hidden md:block bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                        <th className="px-4 py-2.5">
                          <div className="flex items-center gap-1"><ArrowUpDown className="w-3.5 h-3.5" /> Order</div>
                        </th>
                        <th className="px-4 py-2.5">Member Name</th>
                        <th className="px-4 py-2.5">Designation</th>
                        <th className="px-4 py-2.5">Committee Group</th>
                        <th className="px-4 py-2.5">Contact Details</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredLeaders.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-slate-400 font-bold">#{l.displayOrder}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              {l.profilePicUrl ? (
                                <img
                                  src={l.profilePicUrl}
                                  alt={l.fullName}
                                  className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = "none";
                                    const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (sibling) sibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0 ${
                                  l.profilePicUrl ? "hidden" : "flex"
                                }`}
                              >
                                {l.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight">{l.fullName}</p>
                                {(l.flatNo || l.block) && (
                                  <span className="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 mt-0.5">
                                    Unit: {l.block} {l.flatNo}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                              <Award className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span>{l.designation}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">
                            {l.committee ? (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/70 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                                <Landmark className="w-3 h-3 text-amber-700 shrink-0" />
                                {l.committee}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 space-y-0.5 text-xs text-slate-600">
                            {l.contactPhone && (
                              <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-slate-800">
                                <Phone className="w-3 h-3 text-emerald-600" /> {l.contactPhone}
                              </div>
                            )}
                            {l.contactEmail && (
                              <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                                <Mail className="w-3 h-3 text-indigo-600" /> {l.contactEmail}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {/* Desktop: Show all 3 action buttons side-by-side directly */}
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openLeaderHistory(l)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer border border-emerald-200/60"
                                title="View Council History & Tenure"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditLeader(l)}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer border border-indigo-200/60"
                                title="Edit Leader Details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLeader(l)}
                                disabled={deletingLeaderId === l.id}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer border border-rose-200/60 disabled:opacity-50"
                                title="Remove Leader"
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
            </>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 2: WHO TO CALL DIRECTORY ───────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "who_to_call" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                value={whoToCallSearch}
                onChange={(e) => setWhoToCallSearch(e.target.value)}
                placeholder="Search department, contact person..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredWhoToCall.length}</span> of{" "}
              <span className="font-bold text-slate-900">{whoToCallList.length}</span> contacts
            </div>
          </div>

          {loadingWhoToCall ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200/60 rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
              <span className="text-xs font-semibold text-slate-500">Loading Who to Call directory...</span>
            </div>
          ) : filteredWhoToCall.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200/70 rounded-xl p-4">
              <Inbox className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-600" />
              <p className="text-xs sm:text-sm text-slate-700 font-bold">
                {whoToCallSearch ? "No contacts match your search" : "No Who to Call contacts added yet"}
              </p>
              {!whoToCallSearch && (
                <button
                  onClick={openCreateWhoToCall}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Contact
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {filteredWhoToCall.map((c) => {
                const colorClass = DEPARTMENT_COLORS[c.department] || c.color || "text-indigo-600 bg-indigo-50 border-indigo-200";
                return (
                  <div
                    key={c.id}
                    className={`bg-white rounded-xl border transition-all p-3 flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                      !c.isActive ? "opacity-60 border-dashed border-slate-300" : "border-slate-200/80"
                    }`}
                  >
                    <div>
                      {/* Department header badge & emergency indicator */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1.5 rounded-lg border text-xs font-black shrink-0 ${colorClass}`}>
                            <Wrench className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">{c.department}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {c.isEmergency && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-extrabold bg-red-100 text-red-700 border border-red-200 shrink-0">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Emergency
                                </span>
                              )}
                              <span className="text-[10.5px] text-slate-500 font-medium truncate flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                {c.availability || "24/7 Available"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                            c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {/* Contact person & location info */}
                      <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100 space-y-1 my-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs">{c.contactPerson}</span>
                          {c.designation && (
                            <span className="text-[10.5px] text-slate-500 font-medium truncate ml-1">({c.designation})</span>
                          )}
                        </div>
                        {c.locationOrDesk && (
                          <div className="flex items-center gap-1 text-[10.5px] text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{c.locationOrDesk}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 text-slate-700 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <a href={`tel:${c.phoneNumber}`} className="font-semibold text-emerald-700 hover:underline">
                            {c.phoneNumber}
                          </a>
                          {c.secondaryPhone && (
                            <span className="text-slate-400 text-[10px]">/ {c.secondaryPhone}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Strip */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => openContactHistory(c)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors"
                        title="View change history log"
                      >
                        <History className="w-3 h-3" /> History
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleWhoToCallStatus(c)}
                          disabled={togglingId === c.id}
                          className={`p-1 rounded-md border transition-colors cursor-pointer ${
                            c.isActive
                              ? "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          }`}
                          title={c.isActive ? "Deactivate" : "Activate"}
                        >
                          {togglingId === c.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : c.isActive ? (
                            <RotateCcw className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditWhoToCall(c)}
                          className="p-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 transition-colors cursor-pointer"
                          title="Edit contact"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteWhoToCall(c)}
                          disabled={deletingWhoToCallId === c.id}
                          className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 transition-colors cursor-pointer"
                          title="Remove contact"
                        >
                          {deletingWhoToCallId === c.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
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
      {/* ── TAB 3: COMMITTEE GROUPS ─────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "committee_groups" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Search committee groups..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredGroups.length}</span> of{" "}
              <span className="font-bold text-slate-900">{committeeGroups.length}</span> groups
            </div>
          </div>

          {loadingGroups ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200/60 rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600 mb-2" />
              <span className="text-xs font-semibold text-slate-500">Loading committee groups...</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200/70 rounded-xl p-4">
              <Landmark className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-600" />
              <p className="text-xs sm:text-sm text-slate-700 font-bold">
                {groupSearch ? "No committee groups match your search" : "No committee groups added yet"}
              </p>
              {!groupSearch && (
                <button
                  onClick={openCreateGroup}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Group
                </button>
              )}
            </div>
          ) : (
            <>
              {/* MOBILE CARDS VIEW (block on mobile, hidden on md+) */}
              <div className="grid grid-cols-1 gap-2.5 md:hidden">
                {filteredGroups.map((g) => (
                  <div
                    key={g.id}
                    className={`bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between gap-2 ${
                      !g.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 shrink-0">
                          <Landmark className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">{g.name}</h4>
                          <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full mt-0.5 inline-block ${
                            g.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                          }`}>
                            {g.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[10.5px] text-slate-400 font-bold">#{g.displayOrder}</span>
                    </div>

                    {g.description && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100">
                        {g.description}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-slate-100">
                      <button
                        onClick={() => handleToggleGroupStatus(g)}
                        disabled={togglingGroupId === g.id}
                        className={`p-1 rounded-md border transition-colors cursor-pointer ${
                          g.isActive
                            ? "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                        title={g.isActive ? "Deactivate" : "Activate"}
                      >
                        {togglingGroupId === g.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditGroup(g)}
                        className="p-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                        title="Edit group"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(g)}
                        disabled={deletingGroupId === g.id}
                        className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                        title="Delete group"
                      >
                        {deletingGroupId === g.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW (hidden on mobile, block on md+) */}
              <div className="hidden md:block bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                        <th className="px-4 py-2.5">
                          <div className="flex items-center gap-1"><ArrowUpDown className="w-3.5 h-3.5" /> Order</div>
                        </th>
                        <th className="px-4 py-2.5">Committee Group Name</th>
                        <th className="px-4 py-2.5">Description</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredGroups.map((g) => (
                        <tr key={g.id} className={`hover:bg-slate-50/70 transition-colors ${!g.isActive ? "opacity-60" : ""}`}>
                          <td className="px-4 py-2.5 font-mono text-slate-400 font-bold">#{g.displayOrder}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded-md bg-amber-50 text-amber-700">
                                <Landmark className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-bold text-slate-900 text-xs">{g.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs truncate">
                            {g.description || <span className="italic text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              g.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                            }`}>
                              {g.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleToggleGroupStatus(g)}
                                disabled={togglingGroupId === g.id}
                                className={`p-1 rounded-md border transition-colors cursor-pointer ${
                                  g.isActive
                                    ? "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                }`}
                                title={g.isActive ? "Deactivate" : "Activate"}
                              >
                                {togglingGroupId === g.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => openEditGroup(g)}
                                className="p-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                                title="Edit group"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(g)}
                                disabled={deletingGroupId === g.id}
                                className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                title="Delete group"
                              >
                                {deletingGroupId === g.id ? (
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
            </>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 4: CHANGE HISTORY AUDIT LOG ────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-600" />
                Directory &amp; Council Audit History
              </h3>
              <p className="text-[11px] text-slate-500">
                Complete timeline of leadership appointments, designations, and Who to Call modifications.
              </p>
            </div>
            <button
              onClick={loadAllHistory}
              className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shrink-0"
            >
              <RotateCcw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {/* History Sub-Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setHistoryFilter("all")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  historyFilter === "all"
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({historyList.length + leaderHistoryList.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter("leaders")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  historyFilter === "leaders"
                    ? "bg-white text-violet-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Leaders ({leaderHistoryList.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter("who_to_call")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  historyFilter === "who_to_call"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Who to Call ({historyList.length})
              </button>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history records..."
                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200/60 rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
              <span className="text-xs font-semibold text-slate-500">Loading audit history...</span>
            </div>
          ) : combinedHistory.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200/70 rounded-xl p-4">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
              <p className="text-xs sm:text-sm text-slate-700 font-bold">
                {historySearch ? "No history records match your search" : "No history recorded yet"}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {combinedHistory.map((item, idx) => {
                  if (item.type === "leader") {
                    const h = item.data;
                    const actionBadge =
                      h.action === "APPOINTED" || h.action === "CREATED"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : h.action === "UPDATED"
                        ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                        : h.action === "REMOVED" || h.action === "DELETED"
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : h.action === "RESTORED"
                        ? "bg-sky-100 text-sky-800 border-sky-200"
                        : "bg-amber-100 text-amber-800 border-amber-200";

                    return (
                      <div key={`leader-${h.id}-${idx}`} className="p-3 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className={`px-2 py-0.5 rounded-md text-[10px] font-black border shrink-0 mt-0.5 ${actionBadge}`}>
                            {h.action}
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wide bg-violet-50 text-violet-700 px-1.5 py-0.2 rounded border border-violet-200/70">
                                <Crown className="w-2.5 h-2.5 text-violet-600" /> Leader
                              </span>
                              <span className="font-bold text-xs text-slate-900 truncate">{h.fullName}</span>
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                {h.designation}
                              </span>
                              {h.committee && (
                                <span className="text-[10.5px] text-slate-500 font-medium">({h.committee})</span>
                              )}
                            </div>

                            {h.changeSummary && (
                              <p className="text-[11px] text-slate-700 bg-slate-50 rounded-lg p-2 border border-slate-200/70 font-medium">
                                {h.changeSummary}
                              </p>
                            )}

                            <p className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                              <span>
                                By <strong className="text-slate-700 font-bold">{h.changedByName || "Admin"}</strong>
                              </span>
                              <span>•</span>
                              <span>{new Date(h.createdAt).toLocaleString()}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const h = item.data;
                    const actionBadge =
                      h.action === "CREATED"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : h.action === "UPDATED"
                        ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                        : h.action === "RESTORED"
                        ? "bg-sky-100 text-sky-800 border-sky-200"
                        : "bg-rose-100 text-rose-800 border-rose-200";

                    return (
                      <div key={`who-${h.id}-${idx}`} className="p-3 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className={`px-2 py-0.5 rounded-md text-[10px] font-black border shrink-0 mt-0.5 ${actionBadge}`}>
                            {h.action}
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wide bg-sky-50 text-sky-700 px-1.5 py-0.2 rounded border border-sky-200/70">
                                <Building2 className="w-2.5 h-2.5 text-sky-600" /> Who to Call
                              </span>
                              <span className="font-bold text-xs text-slate-900 truncate">{h.department}</span>
                              <span className="text-[10.5px] text-slate-500 font-medium truncate">
                                ({h.contactPerson} • {h.phoneNumber})
                              </span>
                            </div>

                            {h.changeSummary && (
                              <p className="text-[11px] text-slate-700 bg-slate-50 rounded-lg p-2 border border-slate-200/70 font-medium">
                                {h.changeSummary}
                              </p>
                            )}

                            <p className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                              <span>
                                By <strong className="text-slate-700 font-bold">{h.changedByName || "Admin"}</strong>
                              </span>
                              <span>•</span>
                              <span>{new Date(h.createdAt).toLocaleString()}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
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

              {/* Committee Group Select / Add */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Committee Group
                  </label>
                  {!isAddingNewGroup && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewGroup(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      + Add New Group
                    </button>
                  )}
                </div>

                {isAddingNewGroup ? (
                  <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Type new committee group name (e.g. Youth Wing)..."
                      className="w-full px-3 py-2 border border-indigo-300 rounded-xl bg-white text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                    <input
                      type="text"
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      placeholder="Optional short description..."
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-800 text-[11px] outline-none"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewGroup(false);
                          setNewGroupName("");
                          setNewGroupDescription("");
                        }}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddNewGroup}
                        disabled={addingGroupSaving}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        {addingGroupSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Save to Database
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={leaderForm.committee || ""}
                    onChange={(e) => setLeaderForm({ ...leaderForm, committee: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 bg-white"
                  >
                    <option value="">-- No Committee (Executive / General Council) --</option>
                    {committeeGroups
                      .filter((g) => g.isActive)
                      .map((g) => (
                        <option key={g.id} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                  </select>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Select a saved committee group from the database or add a new one.
                </p>
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
      {/* ── MODAL: ADD / EDIT COMMITTEE GROUP ───────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {groupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {groupModal === "create" ? "Add Committee Group" : "Edit Committee Group"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Saved to the database for this community.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGroupModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGroupSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Committee Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="e.g. Cultural & Events Committee, Maintenance..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="Brief description of the committee's responsibilities..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  value={groupForm.displayOrder}
                  onChange={(e) => setGroupForm({ ...groupForm, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGroupModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={groupSaving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {groupSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {groupModal === "create" ? "Save Committee Group" : "Update Committee Group"}
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL: SINGLE LEADER HISTORY & TENURE VIEW ──────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedLeaderHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <span>Council Tenure &amp; Change History</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedLeaderHistory.fullName} • {selectedLeaderHistory.designation}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeaderHistory(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Leader Identity Card */}
            <div className="p-4 bg-violet-50/70 border border-violet-100 rounded-2xl mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {selectedLeaderHistory.fullName[0]}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">{selectedLeaderHistory.fullName}</p>
                  <p className="text-xs text-violet-700 font-semibold">
                    Current: {selectedLeaderHistory.designation} {selectedLeaderHistory.committee ? `(${selectedLeaderHistory.committee})` : ""}
                  </p>
                </div>
              </div>
              {(selectedLeaderHistory.block || selectedLeaderHistory.flatNo) && (
                <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-violet-200">
                  Unit: {selectedLeaderHistory.block} {selectedLeaderHistory.flatNo}
                </span>
              )}
            </div>

            {loadingSingleLeaderHistory ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-600" />
                <span className="text-xs font-semibold">Loading tenure history...</span>
              </div>
            ) : leaderHistoryModalList.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs font-semibold space-y-2">
                <Award className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No historical updates recorded for this leader yet.</p>
                <p className="text-[11px] text-slate-400 font-normal">
                  All future appointments, designation updates, and tenure events will be tracked here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderHistoryModalList.map((h, i) => {
                  const badgeColor =
                    h.action === "APPOINTED" || h.action === "CREATED"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : h.action === "UPDATED"
                      ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                      : h.action === "REMOVED"
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : "bg-amber-100 text-amber-800 border-amber-200";

                  return (
                    <div key={h.id || i} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                          {h.action}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(h.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="font-semibold text-slate-800 pt-0.5">
                        <span className="text-indigo-700 font-bold">{h.designation}</span>
                        {h.committee && <span className="text-slate-500"> • {h.committee}</span>}
                      </div>

                      {h.changeSummary && (
                        <p className="text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 font-medium">
                          {h.changeSummary}
                        </p>
                      )}

                      <p className="text-[10px] text-slate-400 pt-0.5">
                        Author / Approver: <span className="font-bold text-slate-600">{h.changedByName || "Admin"}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
