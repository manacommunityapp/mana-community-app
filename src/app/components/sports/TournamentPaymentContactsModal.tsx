import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  CreditCard,
  Phone,
  Copy,
  Check,
  Plus,
  Trash2,
  Users,
  Info,
  Search,
  ChevronDown,
  UserCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { tournamentPaymentService } from "../../../services/sports/tournamentPaymentService";
import { userService } from "../../../services/common/userService";
import type { DashboardTournamentCard } from "../../../services/sports/sportsDashboardService";
import type { SportsTournament, UserResponse } from "../../../types/api";
import { formatFlatLabel } from "../../../utils/sportsValidationUtils";

export interface PaymentCoordinator {
  id: string;
  name: string;
  title: string;
  detail: string; // phone, flat, UPI, etc.
}

interface TournamentPaymentContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: DashboardTournamentCard | SportsTournament | any | null;
  onOpenFeeModal?: (tournament: any) => void;
  onTournamentUpdated?: (updated: any) => void;
}

export function TournamentPaymentContactsModal({
  isOpen,
  onClose,
  tournament,
  onOpenFeeModal,
  onTournamentUpdated,
}: TournamentPaymentContactsModalProps) {
  const { user, isAdmin, isSuperAdmin, isSportsAdmin } = useAuth();
  const canManage = isAdmin || isSuperAdmin || isSportsAdmin;

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isAddingCoordinator, setIsAddingCoordinator] = useState(false);
  const [savingCoordinator, setSavingCoordinator] = useState(false);

  // Form state for adding/editing a new coordinator
  const [newTitle, setNewTitle] = useState("Block Coordinator");
  const [newName, setNewName] = useState("");
  const [newDetail, setNewDetail] = useState("");

  // Community user search & dropdown state
  const [communityUsers, setCommunityUsers] = useState<UserResponse[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const effectiveCommunityId: number | null = useMemo(() => {
    const cId =
      (tournament as any)?.communityId ??
      (tournament as any)?.community?.id ??
      user?.communityId;
    return cId ? Number(cId) : null;
  }, [tournament, user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch community users when adding coordinator
  useEffect(() => {
    if (!isAddingCoordinator || !effectiveCommunityId) return;
    if (communityUsers.length > 0) return;

    let isMounted = true;
    setLoadingUsers(true);

    userService
      .getCommunityUsers(effectiveCommunityId)
      .then((users) => {
        if (isMounted && Array.isArray(users)) {
          setCommunityUsers(users);
        }
      })
      .catch((err) => {
        console.warn("Failed to load community users for payment coordinators", err);
      })
      .finally(() => {
        if (isMounted) setLoadingUsers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAddingCoordinator, effectiveCommunityId, communityUsers.length]);

  // Filtered users based on search query
  const filteredUsers = useMemo(() => {
    const query = userSearchQuery.trim().toLowerCase();
    if (!query) {
      return communityUsers.slice(0, 15);
    }
    return communityUsers
      .filter((u) => {
        const name = (u.fullName || "").toLowerCase();
        const flat = (u.flatNo || "").toLowerCase();
        const block = (u.block || "").toLowerCase();
        const phone = (u.phone || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        return (
          name.includes(query) ||
          flat.includes(query) ||
          block.includes(query) ||
          phone.includes(query) ||
          email.includes(query)
        );
      })
      .slice(0, 20);
  }, [communityUsers, userSearchQuery]);

  const handleSelectUser = (u: UserResponse) => {
    setSelectedUser(u);
    setUserSearchQuery("");
    setIsUserDropdownOpen(false);

    // Auto-fill manual form fields
    setNewName(u.fullName || "");

    // Auto-fill Role / Block
    if (u.block) {
      setNewTitle(`${u.block} Coordinator`);
    } else if (u.flatNo) {
      setNewTitle(`Flat ${u.flatNo} Coordinator`);
    } else {
      setNewTitle("Block Coordinator");
    }

    // Auto-fill details (Flat, Block, Phone)
    const detailParts: string[] = [];
    const formattedFlat = formatFlatLabel(u.flatNo, u.block);
    if (formattedFlat) detailParts.push(formattedFlat);
    if (u.phone) detailParts.push(`Ph: ${u.phone}`);
    setNewDetail(detailParts.join(", "));
  };

  const handleClearSelectedUser = () => {
    setSelectedUser(null);
    setUserSearchQuery("");
  };

  const resetAddForm = () => {
    setNewName("");
    setNewTitle("Block Coordinator");
    setNewDetail("");
    setSelectedUser(null);
    setUserSearchQuery("");
    setIsUserDropdownOpen(false);
    setIsAddingCoordinator(false);
  };

  // Parse list of coordinators from tournament
  const coordinators = useMemo<PaymentCoordinator[]>(() => {
    if (!tournament) return [];
    const list: PaymentCoordinator[] = [];

    // 1. Direct Organizer fields
    const directName = (tournament as any).contactName;
    const directPhone = (tournament as any).contactNumber || (tournament as any).contactEmail;
    const directTitle = (tournament as any).contactTitle || "Tournament Director";
    if (directName) {
      list.push({
        id: `direct_${directName}`,
        name: directName,
        title: directTitle,
        detail: directPhone || "",
      });
    }

    // 2. Structured contacts
    const rawContacts = (tournament as any).contacts;
    if (Array.isArray(rawContacts)) {
      rawContacts.forEach((c: any, idx: number) => {
        if (c && (c.name || c.phone || c.number)) {
          const name = c.name || "Coordinator";
          if (!list.some((existing) => existing.name.toLowerCase() === name.toLowerCase())) {
            list.push({
              id: `c_${idx}`,
              name,
              title: c.title || "Organizing Committee",
              detail: c.number || c.phone || c.email || "",
            });
          }
        }
      });
    }

    // 3. otherContacts (JSON or array)
    const rawOther = (tournament as any).otherContacts;
    let otherArr: any[] = [];
    if (Array.isArray(rawOther)) {
      otherArr = rawOther;
    } else if (typeof rawOther === "string") {
      try {
        const parsed = JSON.parse(rawOther);
        if (Array.isArray(parsed)) otherArr = parsed;
      } catch {}
    }

    otherArr.forEach((c: any, idx: number) => {
      if (c && (c.name || c.title || c.detail)) {
        list.push({
          id: `other_${idx}`,
          name: c.name || "Coordinator",
          title: c.title || "Payment Representative",
          detail: c.detail || "",
        });
      }
    });

    return list;
  }, [tournament]);

  if (!isOpen || !tournament) return null;

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Please enter the coordinator's name");
      return;
    }

    setSavingCoordinator(true);
    try {
      // Existing otherContacts
      const rawOther = (tournament as any).otherContacts;
      let otherArr: any[] = [];
      if (Array.isArray(rawOther)) {
        otherArr = [...rawOther];
      } else if (typeof rawOther === "string") {
        try {
          const parsed = JSON.parse(rawOther);
          if (Array.isArray(parsed)) otherArr = [...parsed];
        } catch {}
      }

      const updatedOther = [
        ...otherArr,
        {
          title: newTitle.trim() || "Payment Coordinator",
          name: newName.trim(),
          detail: newDetail.trim(),
        },
      ];

      // Update tournament payment coordinators (otherContacts)
      await tournamentPaymentService.updateTournamentOtherContacts(
        tournament.id,
        JSON.stringify(updatedOther),
        {
          ...tournament,
          communityId: effectiveCommunityId,
          eventDateStart: tournament.eventDateStart || (tournament as any).startDate,
          eventDateEnd: tournament.eventDateEnd || (tournament as any).endDate,
        }
      );

      // Mutate local tournament object
      tournament.otherContacts = JSON.stringify(updatedOther);
      if (onTournamentUpdated) {
        onTournamentUpdated({
          ...tournament,
          otherContacts: JSON.stringify(updatedOther),
        });
      }

      toast.success(`Added payment coordinator: ${newName.trim()}`);
      resetAddForm();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add payment coordinator");
    } finally {
      setSavingCoordinator(false);
    }
  };

  const handleRemoveCoordinator = async (coordToRemove: PaymentCoordinator) => {
    if (!coordToRemove.id.startsWith("other_")) {
      toast.error("Primary tournament organizers can be updated via tournament edit");
      return;
    }
    const confirmed = window.confirm(`Remove ${coordToRemove.name} from payment contacts?`);
    if (!confirmed) return;

    try {
      const rawOther = (tournament as any).otherContacts;
      let otherArr: any[] = [];
      if (Array.isArray(rawOther)) {
        otherArr = [...rawOther];
      } else if (typeof rawOther === "string") {
        try {
          const parsed = JSON.parse(rawOther);
          if (Array.isArray(parsed)) otherArr = [...parsed];
        } catch {}
      }

      const updatedOther = otherArr.filter(
        (c) => !(c.name === coordToRemove.name && c.detail === coordToRemove.detail)
      );

      // Update tournament payment coordinators (otherContacts)
      await tournamentPaymentService.updateTournamentOtherContacts(
        tournament.id,
        JSON.stringify(updatedOther),
        {
          ...tournament,
          communityId: effectiveCommunityId,
          eventDateStart: tournament.eventDateStart || (tournament as any).startDate,
          eventDateEnd: tournament.eventDateEnd || (tournament as any).endDate,
        }
      );

      tournament.otherContacts = JSON.stringify(updatedOther);
      if (onTournamentUpdated) {
        onTournamentUpdated({
          ...tournament,
          otherContacts: JSON.stringify(updatedOther),
        });
      }
      toast.success(`Removed ${coordToRemove.name}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove coordinator");
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col max-h-[90vh] w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-100">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate max-w-[260px] sm:max-w-md">
                  {tournament.name}
                </h3>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                Tournament Fee Payment &amp; Collection Representatives
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Payment Guidance Banner */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 space-y-1">
              <div className="font-bold">Tournament Fee Collection Guidelines</div>
              <p className="text-indigo-800 text-[11px] leading-relaxed">
                Residents and participants can pay tournament registration fees directly to any of the designated committee members or block collection leads listed below. When paying via Cash or UPI, mention your registered flat number and player name for easy reconciliation.
              </p>
            </div>
          </div>

          {/* Coordinators List Header */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Authorized Payment Coordinators ({coordinators.length})
              </h4>
            </div>

            {canManage && !isAddingCoordinator && (
              <button
                type="button"
                onClick={() => setIsAddingCoordinator(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Coordinator</span>
              </button>
            )}
          </div>

          {/* Add Coordinator Inline Form (for Admins) */}
          {isAddingCoordinator && (
            <form
              onSubmit={handleAddCoordinator}
              className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between pb-1 border-b border-indigo-100">
                <span className="text-xs font-bold text-indigo-900">Add Payment Coordinator / Block Lead</span>
                <button
                  type="button"
                  onClick={resetAddForm}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Search Community Users Dropdown */}
              <div className="space-y-1 relative" ref={searchContainerRef}>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Community Resident / Member <span className="text-[10px] font-normal text-slate-500">(Search Dropdown)</span>
                  </label>
                  {selectedUser && (
                    <button
                      type="button"
                      onClick={handleClearSelectedUser}
                      className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        setIsUserDropdownOpen(true);
                      }}
                      onFocus={() => setIsUserDropdownOpen(true)}
                      placeholder={
                        selectedUser
                          ? `Selected: ${selectedUser.fullName} (Click to change)`
                          : loadingUsers
                          ? "Loading community residents..."
                          : "Search resident by name, flat number, block, phone..."
                      }
                      className="w-full rounded-lg border border-slate-300 pl-8 pr-8 py-1.5 text-xs text-slate-800 bg-white placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                    />
                    {loadingUsers ? (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin absolute right-2.5 pointer-events-none" />
                    ) : userSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => setUserSearchQuery("")}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-2 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-2 cursor-pointer"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-150 ${
                            isUserDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl py-1 text-xs divide-y divide-slate-100">
                      {loadingUsers ? (
                        <div className="p-3 text-center text-slate-500 flex items-center justify-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                          <span>Loading community residents...</span>
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="p-3 text-center text-slate-500">
                          {userSearchQuery ? (
                            <span>No residents found matching "{userSearchQuery}"</span>
                          ) : (
                            <span>No community residents available</span>
                          )}
                        </div>
                      ) : (
                        filteredUsers.map((u) => {
                          const isCurrent = selectedUser?.id === u.id;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => handleSelectUser(u)}
                              className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2.5 hover:bg-indigo-50/70 transition-colors cursor-pointer ${
                                isCurrent ? "bg-indigo-50/90 font-bold" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs ring-1 ring-indigo-200">
                                  {(u.fullName || "?").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 truncate">
                                    {u.fullName}
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                                    {(u.flatNo || u.block) && <span>{formatFlatLabel(u.flatNo, u.block)}</span>}
                                    {u.phone && <span>• {u.phone}</span>}
                                  </div>
                                </div>
                              </div>
                              {isCurrent ? (
                                <span className="flex items-center gap-1 text-[10px] text-indigo-700 font-bold shrink-0">
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Selected
                                </span>
                              ) : (
                                u.role && (
                                  <span className="text-[9.5px] uppercase tracking-wide font-semibold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 shrink-0">
                                    {u.role.toLowerCase()}
                                  </span>
                                )
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Selection notice */}
                {selectedUser && (
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200/80 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="text-[11px] text-indigo-950 truncate">
                        Selected <strong>{selectedUser.fullName}</strong>
                        {selectedUser.flatNo || selectedUser.block ? ` (${formatFlatLabel(selectedUser.flatNo, selectedUser.block)})` : ""} — details auto-filled. You can also edit manually below.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSelectedUser}
                      className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 shrink-0 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Entry Fields */}
              <div className="pt-1 border-t border-indigo-100">
                <div className="text-[11px] font-bold text-slate-600 mb-1.5">
                  Coordinator Details <span className="font-normal text-slate-400">(Manual Entry &amp; Customization)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Coordinator Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Role / Block
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Block A Lead / Treasurer"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Phone / Flat Number / UPI Details
                    </label>
                    <input
                      type="text"
                      value={newDetail}
                      onChange={(e) => setNewDetail(e.target.value)}
                      placeholder="e.g. Flat 402, +91 98765 43210 / rajesh@upi"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetAddForm}
                  className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCoordinator}
                  className="px-3.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                >
                  {savingCoordinator ? "Saving..." : "Save Coordinator"}
                </button>
              </div>
            </form>
          )}

          {/* Coordinators Cards List */}
          {coordinators.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <Phone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No specific payment contacts listed yet</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                Please reach out to your Community Sports Committee or check tournament announcements for payment instructions.
              </p>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setIsAddingCoordinator(true)}
                  className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Coordinator</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {coordinators.map((coord) => {
                const phoneMatch = coord.detail.match(/(\+?\d[\d -]{8,15}\d)/);
                const rawPhone = phoneMatch ? phoneMatch[0].replace(/[\s-]/g, "") : null;

                return (
                  <div
                    key={coord.id}
                    className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-200 hover:shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-xs shadow-2xs">
                        {coord.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {coord.name}
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600">
                            {coord.title}
                          </span>
                        </div>

                        {coord.detail && (
                          <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap font-medium">
                            <span>{coord.detail}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {rawPhone && (
                        <a
                          href={`tel:${rawPhone}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs transition-colors"
                          title={`Call ${coord.name}`}
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>Call</span>
                        </a>
                      )}

                      {coord.detail && (
                        <button
                          type="button"
                          onClick={() => handleCopy(coord.detail, coord.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          title="Copy details"
                        >
                          {copiedKey === coord.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}

                      {canManage && coord.id.startsWith("other_") && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCoordinator(coord)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove coordinator"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/70">
          {canManage && onOpenFeeModal ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFeeModal(tournament);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold shadow-2xs cursor-pointer transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Manage Registered Players & Fees</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400">
              Community Sports Committee
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
