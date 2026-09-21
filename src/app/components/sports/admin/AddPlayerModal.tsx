import { useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart2,
  User,
  Mail,
  Trophy,
  Home,
  UserCheck,
  Shield,
  Tag,
  Sparkles
} from "lucide-react";
import type { PlayerCategory } from "../../../../types/api";
import { familyService } from "../../../../services/common/familyService";
import type { FamilyMemberSlim } from "../../../../services/common/familyService";

const calculateAge = (dobString?: string): number | null => {
  if (!dobString) return null;
  try {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  } catch {
    return null;
  }
};

export interface AddPlayerForm {
  id: string;
  playerName: string;
  playerEmail: string;
  categoryId: string;
  avatarUrl: string;
  matchType: string;
  gender?: string;
  age: number;
  flatNumber: string;
  relation: string;
  role: string;
  matches: number;
  runs: number;
  wickets: number;
  strikeRate: number;
  avgScore: number;
  familyMemberId?: number;
  partnerUserId?: number | null;
  partnerFamilyMemberId?: number | null;
  partnerName?: string;
  partnerEmail?: string;
  partnerPhone?: string;
  partnerFlatNumber?: string;
  partnerGender?: string;
  partnerMode?: "community" | "family" | "open_pool" | "manual";
}

/** Per-card result after a batch submit */
export interface CardSubmitResult {
  formId: string;
  playerName: string;
  status: "success" | "error" | "duplicate";
  message?: string;
}

interface AddPlayerModalProps {
  showAddPlayerModal: boolean;
  setShowAddPlayerModal: (v: boolean) => void;
  addPlayerForms: AddPlayerForm[];
  setAddPlayerForms: React.Dispatch<React.SetStateAction<AddPlayerForm[]>>;
  communityUsers: any[];
  loadingUsers: boolean;
  loadingMoreUsers?: boolean;
  hasMoreUsers?: boolean;
  onLoadMoreUsers?: () => void;
  totalUsersCount?: number;
  usersPage?: number;
  usersTotalPages?: number;
  onGoToPage?: (page: number) => void;
  friendSearchQuery: string;
  setFriendSearchQuery: (q: string) => void;
  filteredFriends: any[];
  handleSelectFriend: (friend: any) => void;
  handleSelectFamilyMember?: (familyMember: FamilyMemberSlim, resident: any) => void;
  handleAddNewPlayerCard: () => void;
  handleDeletePlayerCard: (cardId: string) => void;
  handleAddPlayerSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  playerCategories: PlayerCategory[];
  formatDob: (dob?: string) => string;
  /** Email set of already-registered players for badge display */
  registeredEmails?: Set<string>;
  /** Per-card results shown after submit (result summary step) */
  submitResults?: CardSubmitResult[];
  onClearResults?: () => void;
}

export function AddPlayerModal({
  showAddPlayerModal,
  setShowAddPlayerModal,
  addPlayerForms,
  setAddPlayerForms,
  communityUsers,
  loadingUsers,
  totalUsersCount,
  usersPage = 0,
  usersTotalPages = 1,
  onGoToPage,
  friendSearchQuery,
  setFriendSearchQuery,
  filteredFriends,
  handleSelectFriend,
  handleSelectFamilyMember,
  handleAddNewPlayerCard,
  handleDeletePlayerCard,
  handleAddPlayerSubmit,
  submitting,
  playerCategories,
  formatDob,
  registeredEmails = new Set(),
  submitResults,
  onClearResults,
}: AddPlayerModalProps) {
  const [mobileTab, setMobileTab] = useState<"members" | "forms">("members");
  const [expandedFamilyUserIds, setExpandedFamilyUserIds] = useState<Record<number, boolean>>({});
  const [familyMembersByUser, setFamilyMembersByUser] = useState<Record<number, FamilyMemberSlim[]>>({});
  const [loadingFamilyByUser, setLoadingFamilyByUser] = useState<Record<number, boolean>>({});
  const [expandedStatsCards, setExpandedStatsCards] = useState<Record<string, boolean>>({});
  const [partnerSearchQueries, setPartnerSearchQueries] = useState<Record<string, string>>({});
  const [partnerSearchOpen, setPartnerSearchOpen] = useState<Record<string, boolean>>({});

  const toggleFamilyAccordion = async (userId: number) => {
    const isExpanded = !!expandedFamilyUserIds[userId];
    setExpandedFamilyUserIds(prev => ({ ...prev, [userId]: !isExpanded }));

    if (!isExpanded && !familyMembersByUser[userId]) {
      setLoadingFamilyByUser(prev => ({ ...prev, [userId]: true }));
      try {
        const list = await familyService.getSlimFamilyMembers(userId);
        setFamilyMembersByUser(prev => ({ ...prev, [userId]: list || [] }));
      } catch (err) {
        console.error("Failed to load family members for user", userId, err);
        setFamilyMembersByUser(prev => ({ ...prev, [userId]: [] }));
      } finally {
        setLoadingFamilyByUser(prev => ({ ...prev, [userId]: false }));
      }
    }
  };

  const toggleStatsAccordion = (cardId: string) => {
    setExpandedStatsCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  if (!showAddPlayerModal) return null;

  // ── Result summary screen (shown after submit) ───────────────────────────
  if (submitResults && submitResults.length > 0) {
    const successCount = submitResults.filter(r => r.status === "success").length;
    const failCount = submitResults.filter(r => r.status !== "success").length;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 text-left">
          <div className="flex items-center gap-3 border-b border-[#2a3a5c] pb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${failCount === 0 ? "bg-[#10b981]/20 border border-[#10b981]/30" : "bg-[#f97316]/20 border border-[#f97316]/30"}`}>
              {failCount === 0
                ? <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                : <AlertCircle className="w-4 h-4 text-[#f97316]" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#f1f5f9] leading-5">Registration Results</h3>
              <p className="text-xs text-[#94a3b8] leading-4">
                {successCount} added successfully{failCount > 0 ? `, ${failCount} failed` : ""}
              </p>
            </div>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {submitResults.map(res => (
              <div
                key={res.formId}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left ${
                  res.status === "success"
                    ? "bg-[#10b981]/5 border-[#10b981]/20"
                    : res.status === "duplicate"
                    ? "bg-[#eab308]/5 border-[#eab308]/20"
                    : "bg-[#ef4444]/5 border-[#ef4444]/20"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {res.status === "success"
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                    : res.status === "duplicate"
                    ? <AlertCircle className="w-3.5 h-3.5 text-[#eab308]" />
                    : <XCircle className="w-3.5 h-3.5 text-[#ef4444]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#f1f5f9] leading-4 truncate">{res.playerName}</p>
                  {res.message && (
                    <p className={`text-[11px] mt-0.5 leading-4 ${
                      res.status === "success" ? "text-[#10b981]" : res.status === "duplicate" ? "text-[#eab308]" : "text-[#ef4444]"
                    }`}>{res.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              onClearResults?.();
              setShowAddPlayerModal(false);
            }}
            className="w-full py-2 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm font-semibold leading-5 rounded-xl cursor-pointer transition-colors border-none shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Main modal ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#2a3a5c] bg-[#141c2e] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f97316]/15 border border-[#f97316]/30 flex items-center justify-center shadow-xs">
              <Plus className="w-4 h-4 text-[#f97316]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#f1f5f9] leading-5 tracking-tight">Add Tournament Participants</h3>
              <p className="text-xs text-[#94a3b8] leading-4 hidden sm:block">Select community residents or family members to register</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddPlayerModal(false)}
            className="w-7 h-7 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1f2b45] transition-colors cursor-pointer bg-transparent border-none outline-none flex items-center justify-center"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden flex border-b border-[#2a3a5c] bg-[#0c1220]/90 p-1.5 gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("members")}
            className={`flex-1 py-1.5 text-xs font-semibold leading-4 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === "members"
                ? "bg-[#f97316] text-white shadow-xs"
                : "bg-transparent text-[#94a3b8] hover:text-[#f1f5f9]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Community ({totalUsersCount || communityUsers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("forms")}
            className={`flex-1 py-1.5 text-xs font-semibold leading-4 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === "forms"
                ? "bg-[#f97316] text-white shadow-xs"
                : "bg-transparent text-[#94a3b8] hover:text-[#f1f5f9]"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Selected ({addPlayerForms.length})</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleAddPlayerSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col lg:flex-row gap-3.5 sm:gap-4 bg-[#0c1220]/40">

            {/* Left Side Column ("Community Members") */}
            <div className={`w-full lg:w-[38%] flex-col flex-shrink-0 ${mobileTab === "members" ? "flex" : "hidden lg:flex"}`}>
              <div className="p-3 sm:p-3.5 border border-[#2a3a5c] bg-[#141c2e] shadow-lg rounded-2xl flex flex-col h-full space-y-2.5">
                
                {/* Search & Header */}
                <div className="flex flex-col gap-0.5 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs text-[#f1f5f9] uppercase tracking-wider leading-4">Community Members</h4>
                    {totalUsersCount !== undefined && totalUsersCount > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#2a3a5c] text-[#cbd5e1] font-medium leading-4 border border-[#3b4e78]">
                        {totalUsersCount} found
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-4">Pick residents or expand family members</p>
                </div>

                {/* Search input with icon */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search name, flat, email, phone..."
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl pl-8 pr-7 py-1.5 text-xs leading-4 text-[#f1f5f9] focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/30 outline-none placeholder:text-[#64748b] transition-all"
                  />
                  {friendSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFriendSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#94a3b8] hover:text-[#f1f5f9] bg-transparent border-none cursor-pointer p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Members List Container */}
                <div className="mt-1 space-y-2 flex-1 max-h-[50vh] lg:max-h-[58vh] overflow-y-auto pr-1">
                  {loadingUsers ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#f97316]" />
                      <span className="text-xs text-[#94a3b8] leading-4">Loading members...</span>
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-1 text-center">
                      <p className="text-xs font-semibold text-[#94a3b8] leading-4">No members found</p>
                      <p className="text-[11px] text-[#64748b] leading-4">Try searching with a different name, flat, or email</p>
                    </div>
                  ) : (
                    <>
                      {filteredFriends.map(friend => {
                        const isAlreadyRegistered = registeredEmails.has((friend.email || "").toLowerCase());
                        const isAlreadyInList = addPlayerForms.some(
                          p => !p.familyMemberId && (p.playerEmail === friend.email || p.playerName === friend.fullName)
                        );
                        const age = calculateAge(friend.dateOfBirth);
                        const isFamilyExpanded = !!expandedFamilyUserIds[friend.id];
                        const rawFamilyList = familyMembersByUser[friend.id] || [];
                        const familyList = rawFamilyList.filter(fam => {
                          const rel = (fam.relation || "").trim().toLowerCase();
                          if (rel === "self" || rel === "self (head)" || rel === "head" || rel.includes("self")) return false;
                          if (friend.fullName && fam.name && fam.name.trim().toLowerCase() === friend.fullName.trim().toLowerCase()) return false;
                          return true;
                        });
                        const isFamilyLoading = !!loadingFamilyByUser[friend.id];

                        return (
                          <div
                            key={friend.id}
                            className="group flex flex-col p-2.5 rounded-xl border border-[#2a3a5c] bg-[#0c1220]/70 hover:border-[#f97316]/50 transition-all shadow-xs space-y-1.5"
                          >
                            {/* Resident Header */}
                            <div className="flex w-full items-center gap-2.5">
                              {/* Avatar with fallback initials */}
                              <div className="relative h-9 w-9 rounded-full overflow-hidden border border-[#2a3a5c] group-hover:border-[#f97316]/50 transition-colors flex-shrink-0 bg-[#141c2e] flex items-center justify-center shadow-xs">
                                {friend.avatarUrl || friend.profilePicUrl ? (
                                  <img
                                    src={friend.avatarUrl || friend.profilePicUrl}
                                    className="w-full h-full object-cover"
                                    alt={friend.fullName}
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                ) : null}
                                <span className="text-[11px] font-bold text-[#94a3b8] uppercase select-none">
                                  {friend.fullName?.slice(0, 2) || "U"}
                                </span>
                              </div>

                              {/* Member Details */}
                              <div className="flex flex-col gap-0.5 w-full text-left min-w-0">
                                {/* Row 1: Name and Flat Badge */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <p className="font-semibold text-xs text-[#f1f5f9] leading-4 truncate group-hover:text-white transition-colors">
                                    {friend.fullName}
                                  </p>
                                  {friend.flatNo && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 font-medium whitespace-nowrap border border-indigo-500/30 leading-3">
                                      {friend.block ? `${friend.block}-${friend.flatNo}` : `Flat ${friend.flatNo}`}
                                    </span>
                                  )}
                                </div>

                                {/* Row 2: Email */}
                                {friend.email && (
                                  <p className="text-[11px] text-[#94a3b8] leading-4 truncate font-mono">
                                    {friend.email}
                                  </p>
                                )}

                                {/* Row 3: Gender & Age */}
                                <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8] leading-4">
                                  {friend.gender && (
                                    <span className="capitalize font-medium text-[#cbd5e1]">
                                      {friend.gender.toLowerCase()}
                                    </span>
                                  )}
                                  {friend.dateOfBirth && (
                                    <>
                                      <span>•</span>
                                      <span>{age ? `${age} yrs` : formatDob(friend.dateOfBirth)}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {isAlreadyRegistered ? (
                                  <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[#10b981]/15 text-[#10b981] font-semibold border border-[#10b981]/30 flex items-center gap-1 whitespace-nowrap leading-4">
                                    <CheckCircle2 className="w-3 h-3" /> Registered
                                  </span>
                                ) : isAlreadyInList ? (
                                  <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[#f97316]/15 text-[#f97316] font-semibold border border-[#f97316]/30 whitespace-nowrap leading-4">
                                    In list
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleSelectFriend(friend);
                                      if (window.innerWidth < 1024) setMobileTab("forms");
                                    }}
                                    className="px-2.5 py-1 bg-[#f97316]/15 hover:bg-[#f97316] text-[#f97316] hover:text-white border border-[#f97316]/40 hover:border-[#f97316] text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 leading-4"
                                    title="Select Resident"
                                  >
                                    <Plus className="w-3 h-3" /> Select
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Family Members Toggle Header */}
                            <div className="pt-1 border-t border-[#2a3a5c]/40 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => toggleFamilyAccordion(friend.id)}
                                className="text-[11px] px-2 py-0.5 rounded-lg bg-[#141c2e] hover:bg-[#1a2540] text-indigo-300 font-medium border border-[#2a3a5c] transition-colors flex items-center gap-1.5 cursor-pointer leading-4"
                              >
                                <Users className="w-3 h-3 text-indigo-400" />
                                <span>Family Members</span>
                                {familyList.length > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-200 font-bold border border-indigo-500/30">
                                    {familyList.length}
                                  </span>
                                )}
                                <ChevronDown className={`w-3 h-3 transition-transform ${isFamilyExpanded ? "rotate-180" : ""}`} />
                              </button>
                            </div>

                            {/* Family Members Expanded Accordion */}
                            {isFamilyExpanded && (
                              <div className="pl-3 border-l-2 border-indigo-500/40 space-y-1.5 pt-1 pb-0.5">
                                {isFamilyLoading ? (
                                  <div className="flex items-center gap-2 py-1 text-[11px] text-[#94a3b8] leading-4">
                                    <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                                    <span>Loading family members...</span>
                                  </div>
                                ) : familyList.length === 0 ? (
                                  <p className="text-[11px] text-[#64748b] italic py-0.5 leading-4">No family members registered for this resident</p>
                                ) : (
                                  familyList.map(fam => {
                                    const isFamInList = addPlayerForms.some(
                                      p => p.familyMemberId === fam.id || (p.playerName === fam.name && p.flatNumber === friend.flatNo)
                                    );
                                    const famAge = fam.age || (fam.dob ? calculateAge(fam.dob) : null);

                                    return (
                                      <div
                                        key={fam.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-[#141c2e] border border-[#2a3a5c] text-left hover:border-indigo-500/40 transition-colors"
                                      >
                                        <div className="flex flex-col min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-semibold text-[#f1f5f9] leading-4 truncate">{fam.name}</p>
                                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 font-medium whitespace-nowrap border border-indigo-500/30 leading-3">
                                              {fam.relation || "Family"}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-[#94a3b8] leading-4">
                                            {fam.gender && <span className="capitalize">{fam.gender.toLowerCase()}</span>}
                                            {famAge ? ` · ${famAge} yrs` : ""}
                                            {fam.phone ? ` · ${fam.phone}` : ""}
                                          </p>
                                        </div>
                                        <div className="flex-shrink-0 ml-2">
                                          {isFamInList ? (
                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#f97316]/15 text-[#f97316] font-semibold border border-[#f97316]/30 leading-4">
                                              In list
                                            </span>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                handleSelectFamilyMember?.(fam, friend);
                                                if (window.innerWidth < 1024) setMobileTab("forms");
                                              }}
                                              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-md transition-colors cursor-pointer border-none flex items-center gap-1 leading-4 shadow-xs"
                                            >
                                              <Plus className="w-3 h-3" /> Add
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* Pagination Controls (50 per page) */}
                {totalUsersCount !== undefined && totalUsersCount > 0 && (
                  <div className="pt-2.5 border-t border-[#2a3a5c] flex items-center justify-between text-xs text-[#94a3b8] leading-4">
                    <button
                      type="button"
                      onClick={() => onGoToPage?.(usersPage - 1)}
                      disabled={usersPage <= 0 || loadingUsers}
                      className="px-2.5 py-1 bg-[#0c1220] hover:bg-[#1a2540] disabled:opacity-30 disabled:pointer-events-none border border-[#2a3a5c] rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[#f1f5f9] text-xs font-medium leading-4"
                    >
                      <ChevronLeft className="w-3 h-3" /> Prev
                    </button>

                    <span className="text-xs leading-4">
                      Page <span className="font-semibold text-[#f1f5f9]">{usersPage + 1}</span> of <span className="font-semibold text-[#f1f5f9]">{usersTotalPages || 1}</span>
                      <span className="text-[#64748b] ml-1">({totalUsersCount})</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => onGoToPage?.(usersPage + 1)}
                      disabled={usersPage >= usersTotalPages - 1 || loadingUsers}
                      className="px-2.5 py-1 bg-[#0c1220] hover:bg-[#1a2540] disabled:opacity-30 disabled:pointer-events-none border border-[#2a3a5c] rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[#f1f5f9] text-xs font-medium leading-4"
                    >
                      Next <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>


            {/* Right Side Column ("Participant Details Forms") */}
            <div className={`flex-1 flex-col gap-3 rounded-2xl w-full lg:w-[62%] ${mobileTab === "forms" ? "flex" : "hidden lg:flex"}`}>
              {/* Header with Title and Add Button */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-xs text-[#f1f5f9] uppercase tracking-wider leading-4 text-left">Participant Details</h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] font-semibold leading-4 border border-[#10b981]/30">
                    {addPlayerForms.length} participant{addPlayerForms.length > 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddNewPlayerCard}
                  className="flex items-center gap-1 text-xs font-semibold text-[#10b981] hover:text-[#059669] bg-[#10b981]/10 hover:bg-[#10b981]/20 border border-[#10b981]/30 hover:border-[#10b981] rounded-lg px-2.5 py-1 transition-all cursor-pointer leading-4 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Card
                </button>
              </div>

              {/* Cards List or Empty State */}
              <div className="flex flex-col gap-3.5 max-h-[60vh] lg:max-h-[68vh] overflow-y-auto pr-1">
                {addPlayerForms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 sm:p-10 border-2 border-dashed border-[#2a3a5c] rounded-2xl bg-[#141c2e]/60 text-center gap-2.5">
                    <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981]">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-[#f1f5f9] leading-5">No Participants Selected Yet</p>
                      <p className="text-xs text-[#94a3b8] leading-4 max-w-sm">
                        Select a community resident or family member from the left panel, or click below to enter details manually.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddNewPlayerCard}
                      className="mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer border-none shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Participant Card
                    </button>
                  </div>
                ) : (
                  addPlayerForms.map((form, idx) => (
                    <div
                      key={form.id}
                      className="p-3.5 sm:p-4 rounded-2xl flex flex-col gap-3.5 border border-[#2a3a5c] bg-[#141c2e] hover:border-[#3b82f6]/40 transition-all shadow-xl text-left relative"
                    >
                      {/* Card Top Banner */}
                      <div className="flex justify-between items-center pb-2.5 border-b border-[#2a3a5c]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-[11px] font-bold flex items-center justify-center flex-shrink-0 leading-3">
                            #{idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-[#f1f5f9] leading-4 truncate">
                            {form.playerName.trim() || `Participant #${idx + 1}`}
                          </span>
                          {form.familyMemberId ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30 whitespace-nowrap leading-3">
                              Family Member
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] font-semibold border border-[#10b981]/25 whitespace-nowrap leading-3">
                              Resident
                            </span>
                          )}
                        </div>
                        {addPlayerForms.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeletePlayerCard(form.id)}
                            className="flex gap-1 items-center text-xs font-medium text-[#ef4444] hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md px-2 py-0.5 cursor-pointer transition-colors leading-4 flex-shrink-0"
                            title="Remove Card"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {/* Main Card Content */}
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        {/* Avatar preview slot */}
                        <div className="flex flex-col items-center w-full md:w-20 flex-shrink-0 pt-0.5">
                          <label className="mb-1.5 text-center text-xs font-medium text-[#94a3b8] leading-4">Avatar</label>
                          <div className="relative overflow-hidden rounded-xl w-14 h-14 border border-[#2a3a5c] bg-[#0c1220] flex items-center justify-center shadow-inner group">
                            {form.avatarUrl ? (
                              <img
                                src={form.avatarUrl}
                                className="w-full h-full object-cover"
                                alt="Profile"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <User className="w-6 h-6 text-[#64748b]" />
                            )}
                          </div>
                          {form.flatNumber && (
                            <span className="mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-center truncate max-w-full leading-3">
                              Flat {form.flatNumber}
                            </span>
                          )}
                        </div>

                        {/* Input Fields Grid (Label font size 12 = text-xs leading-4) */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                          
                          {/* Player Name */}
                          <div className="flex flex-col w-full gap-1 text-left">
                            <label className="text-xs font-medium text-[#cbd5e1] leading-4 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#94a3b8]" />
                              <span>Player Name</span>
                              <span className="text-[#ef4444] font-semibold">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={form.playerName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, playerName: val } : p));
                              }}
                              placeholder="Full Name"
                              className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-3 py-2 text-xs sm:text-sm leading-5 text-[#f1f5f9] focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 outline-none placeholder:text-[#64748b] transition-all"
                            />
                          </div>

                          {/* Player Email */}
                          <div className="flex flex-col w-full gap-1 text-left">
                            <label className="text-xs font-medium text-[#cbd5e1] leading-4 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-[#94a3b8]" />
                              <span>Player Email</span>
                              <span className="text-[#ef4444] font-semibold">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              value={form.playerEmail}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, playerEmail: val } : p));
                              }}
                              placeholder="player@example.com"
                              className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-3 py-2 text-xs sm:text-sm leading-5 text-[#f1f5f9] focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 outline-none placeholder:text-[#64748b] transition-all font-mono"
                            />
                          </div>

                          {/* Category with eligibility hints */}
                          <div className="flex flex-col w-full gap-1 text-left">
                            <label className="text-xs font-medium text-[#cbd5e1] leading-4 flex items-center gap-1.5">
                              <Trophy className="w-3.5 h-3.5 text-[#94a3b8]" />
                              <span>Tournament Category</span>
                              <span className="text-[#ef4444] font-semibold">*</span>
                            </label>
                            <select
                              required
                              value={form.categoryId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, categoryId: val } : p));
                              }}
                              className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-3 py-2 text-xs sm:text-sm leading-5 text-[#f1f5f9] focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 outline-none transition-all cursor-pointer"
                            >
                              <option value="">Select Category...</option>
                              {playerCategories.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.categoryType}){c.minAge || c.maxAge ? ` · ${c.minAge || 0}-${c.maxAge || "∞"} yrs` : ""}
                                </option>
                              ))}
                            </select>

                            {/* Live Category Eligibility Hint */}
                            {(() => {
                              const selCat = playerCategories.find(c => String(c.id) === String(form.categoryId));
                              if (!selCat) return null;
                              const ageInvalid = (selCat.minAge != null && selCat.minAge > 0 && form.age < selCat.minAge) ||
                                                 (selCat.maxAge != null && selCat.maxAge > 0 && form.age > selCat.maxAge);
                              const genderInvalid = selCat.gender && form.gender && (
                                (["MALE", "MEN", "BOYS"].includes(selCat.gender.toUpperCase()) && ["FEMALE", "WOMEN", "GIRLS"].includes(form.gender.toUpperCase())) ||
                                (["FEMALE", "WOMEN", "GIRLS"].includes(selCat.gender.toUpperCase()) && ["MALE", "MEN", "BOYS"].includes(form.gender.toUpperCase()))
                              );
                              if (!ageInvalid && !genderInvalid) return null;
                              return (
                                <div className="mt-1 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 flex items-center gap-1 leading-3">
                                  <AlertCircle className="w-3 h-3 flex-shrink-0 text-amber-400" />
                                  <span>
                                    {ageInvalid && `Age ${form.age} outside category bounds (${selCat.minAge || 0}-${selCat.maxAge || "∞"} yrs). `}
                                    {genderInvalid && `Category restricted to ${selCat.gender} players.`}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Match Format Pills */}
                          <div className="flex flex-col w-full gap-1 text-left">
                            <label className="text-xs font-medium text-[#cbd5e1] leading-4 flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-[#94a3b8]" />
                              <span>Match Format</span>
                            </label>
                            <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#0c1220] border border-[#2a3a5c] rounded-xl">
                              {[
                                { id: "SINGLES", label: "Singles" },
                                { id: "DOUBLES", label: "Doubles" },
                                { id: "MIXED_DOUBLES", label: "Mixed" }
                              ].map(format => (
                                <button
                                  key={format.id}
                                  type="button"
                                  onClick={() => {
                                    setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, matchType: format.id } : p));
                                  }}
                                  className={`py-1.5 px-1 text-xs font-semibold leading-4 rounded-lg transition-all border-none cursor-pointer text-center truncate ${
                                    (form.matchType || "SINGLES") === format.id
                                      ? "bg-[#f97316] text-white shadow-xs"
                                      : "bg-transparent text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#141c2e]"
                                  }`}
                                >
                                  {format.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Age */}
                          <div className="flex flex-col w-full gap-1 text-left">
                            <label className="text-xs font-medium text-[#cbd5e1] leading-4">Age (Years)</label>
                            <input
                              type="number"
                              min={1}
                              max={120}
                              value={form.age}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 25;
                                setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, age: val } : p));
                              }}
                              className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-3 py-2 text-xs sm:text-sm leading-5 text-[#f1f5f9] focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 outline-none transition-all"
                            />
                          </div>

                          {/* Flat Number */}
                          <div className="flex flex-col w-full gap-1 text-left">
                            <label className="text-xs font-medium text-[#cbd5e1] leading-4 flex items-center gap-1.5">
                              <Home className="w-3.5 h-3.5 text-[#94a3b8]" />
                              <span>Flat / Unit Number</span>
                            </label>
                            <input
                              type="text"
                              value={form.flatNumber}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, flatNumber: val } : p));
                              }}
                              placeholder="e.g. A-102"
                              className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-3 py-2 text-xs sm:text-sm leading-5 text-[#f1f5f9] focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 outline-none placeholder:text-[#64748b] transition-all"
                            />
                          </div>

                          {/* Relation */}
                          <div className="flex flex-col w-full gap-1 text-left">
                            <label className="text-xs font-medium text-[#cbd5e1] leading-4 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-[#94a3b8]" />
                              <span>Relation</span>
                            </label>
                            <select
                              value={form.relation}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, relation: val } : p));
                              }}
                              className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-3 py-2 text-xs sm:text-sm leading-5 text-[#f1f5f9] focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 outline-none transition-all cursor-pointer"
                            >
                              <option value="SELF">Self</option>
                              <option value="SPOUSE">Spouse</option>
                              <option value="CHILD">Child</option>
                              <option value="PARENT">Parent</option>
                              <option value="SIBLING">Sibling</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>

                          {/* Primary Role */}
                          <div className="flex flex-col w-full gap-1 text-left">
                            <label className="text-xs font-medium text-[#cbd5e1] leading-4 flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-[#94a3b8]" />
                              <span>Playing Role</span>
                            </label>
                            <input
                              type="text"
                              value={form.role}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, role: val } : p));
                              }}
                              placeholder="e.g. Batsman, Defender, Striker"
                              className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-xl px-3 py-2 text-xs sm:text-sm leading-5 text-[#f1f5f9] focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 outline-none placeholder:text-[#64748b] transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ── Doubles & Mixed Doubles Partner Section ──────────────── */}
                      {(form.matchType === "DOUBLES" || form.matchType === "MIXED_DOUBLES") && (
                        <div className="border-t border-[#2a3a5c] pt-3 text-left space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="text-xs font-semibold text-[#f1f5f9] leading-4">
                                {form.matchType === "MIXED_DOUBLES" ? "Mixed Doubles Partner" : "Doubles Partner"}
                              </span>
                              <span className="text-[#ef4444] font-bold text-xs">*</span>
                              {form.matchType === "MIXED_DOUBLES" && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                  1 Male + 1 Female
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#94a3b8] leading-4">
                              {form.partnerMode === "open_pool" ? "Open Pairing Pool" : form.partnerName ? "Partner Selected" : "Required"}
                            </span>
                          </div>

                          {/* Selected Partner Display Card */}
                          {form.partnerUserId || form.partnerFamilyMemberId || form.partnerName || form.partnerMode === "open_pool" ? (
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c1220] border border-indigo-500/40 shadow-inner">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                  {form.partnerMode === "open_pool" ? "✨" : (form.partnerName?.charAt(0).toUpperCase() || "P")}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-semibold text-[#f1f5f9] truncate">
                                      {form.partnerMode === "open_pool" ? "Looking for Partner (Open Pool)" : form.partnerName}
                                    </p>
                                    {form.partnerGender && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-medium">
                                        {form.partnerGender}
                                      </span>
                                    )}
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                                      {form.partnerMode === "open_pool" ? "Open Pool" : form.partnerFamilyMemberId ? "Family" : "Neighbor"}
                                    </span>
                                  </div>
                                  {form.partnerFlatNumber && (
                                    <p className="text-[10px] text-[#94a3b8]">Flat {form.partnerFlatNumber}</p>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setAddPlayerForms(prev => prev.map(p => p.id === form.id ? {
                                    ...p,
                                    partnerUserId: null,
                                    partnerFamilyMemberId: null,
                                    partnerName: "",
                                    partnerEmail: "",
                                    partnerPhone: "",
                                    partnerFlatNumber: "",
                                    partnerGender: "",
                                    partnerMode: "community"
                                  } : p));
                                }}
                                className="p-1 text-[#94a3b8] hover:text-[#ef4444] hover:bg-red-500/10 rounded-md transition cursor-pointer bg-transparent border-none flex items-center justify-center"
                                title="Remove Partner"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            /* Partner Selection Controls */
                            <div className="space-y-2 p-2.5 rounded-xl bg-[#0c1220]/70 border border-[#2a3a5c]">
                              {/* Partner search autocomplete */}
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder="Search neighbor by name or flat number..."
                                  value={partnerSearchQueries[form.id] || ""}
                                  onFocus={() => setPartnerSearchOpen(prev => ({ ...prev, [form.id]: true }))}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setPartnerSearchQueries(prev => ({ ...prev, [form.id]: val }));
                                    setPartnerSearchOpen(prev => ({ ...prev, [form.id]: true }));
                                  }}
                                  className="w-full bg-[#141c2e] border border-[#2a3a5c] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#f1f5f9] placeholder:text-[#64748b] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition"
                                />
                                {partnerSearchQueries[form.id] && (
                                  <button
                                    type="button"
                                    onClick={() => setPartnerSearchQueries(prev => ({ ...prev, [form.id]: "" }))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#94a3b8] hover:text-[#f1f5f9] bg-transparent border-none cursor-pointer p-1"
                                  >
                                    ✕
                                  </button>
                                )}

                                {/* Autocomplete dropdown */}
                                {partnerSearchOpen[form.id] && partnerSearchQueries[form.id]?.trim() && (
                                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#141c2e] border border-[#2a3a5c] rounded-xl shadow-xl max-h-40 overflow-y-auto z-30 divide-y divide-[#2a3a5c]/50">
                                    {communityUsers
                                      .filter(u => {
                                        // exclude primary player
                                        if (u.email && form.playerEmail && u.email.toLowerCase() === form.playerEmail.toLowerCase()) return false;
                                        if (u.fullName && form.playerName && u.fullName.toLowerCase() === form.playerName.toLowerCase()) return false;
                                        const query = (partnerSearchQueries[form.id] || "").toLowerCase();
                                        return (u.fullName && u.fullName.toLowerCase().includes(query)) ||
                                               (u.flatNo && String(u.flatNo).toLowerCase().includes(query)) ||
                                               (u.email && u.email.toLowerCase().includes(query));
                                      })
                                      .map(u => (
                                        <button
                                          key={u.id}
                                          type="button"
                                          onClick={() => {
                                            setAddPlayerForms(prev => prev.map(p => p.id === form.id ? {
                                              ...p,
                                              partnerUserId: u.id,
                                              partnerFamilyMemberId: null,
                                              partnerName: u.fullName || "Resident",
                                              partnerEmail: u.email || "",
                                              partnerPhone: u.phone || "",
                                              partnerFlatNumber: u.flatNo || "",
                                              partnerGender: u.gender || "",
                                              partnerMode: "community"
                                            } : p));
                                            setPartnerSearchOpen(prev => ({ ...prev, [form.id]: false }));
                                            setPartnerSearchQueries(prev => ({ ...prev, [form.id]: "" }));
                                          }}
                                          className="w-full p-2 text-left hover:bg-indigo-500/10 flex items-center justify-between gap-2 transition cursor-pointer border-none bg-transparent"
                                        >
                                          <div className="min-w-0">
                                            <p className="text-xs font-semibold text-[#f1f5f9] truncate">{u.fullName}</p>
                                            <p className="text-[10px] text-[#94a3b8]">{u.flatNo ? `Flat ${u.flatNo}` : ""} {u.gender ? `· ${u.gender}` : ""}</p>
                                          </div>
                                          <span className="text-[11px] text-indigo-400 font-semibold flex-shrink-0">Select →</span>
                                        </button>
                                      ))}
                                  </div>
                                )}
                              </div>

                              {/* Quick Action: Open Pool Button */}
                              <div className="flex items-center justify-between pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddPlayerForms(prev => prev.map(p => p.id === form.id ? {
                                      ...p,
                                      partnerUserId: null,
                                      partnerFamilyMemberId: null,
                                      partnerName: "Looking for Partner (Open Pool)",
                                      partnerMode: "open_pool"
                                    } : p));
                                  }}
                                  className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg px-2.5 py-1 transition cursor-pointer flex items-center gap-1"
                                >
                                  ✨ Need Partner (Open Pairing Pool)
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Optional Statistics Accordion */}
                      <div className="border-t border-[#2a3a5c] pt-2.5">
                        <button
                          type="button"
                          onClick={() => toggleStatsAccordion(form.id)}
                          className="flex items-center justify-between w-full text-xs font-semibold text-[#94a3b8] hover:text-[#f1f5f9] bg-transparent border-none cursor-pointer py-0.5 transition-colors leading-4"
                        >
                          <span className="flex items-center gap-1.5">
                            <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Player Past Statistics</span>
                            <span className="text-[11px] text-[#64748b] font-normal leading-4">(Optional)</span>
                          </span>
                          {expandedStatsCards[form.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {expandedStatsCards[form.id] && (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 p-2.5 mt-1.5 rounded-xl bg-[#0c1220]/60 border border-[#2a3a5c]/80 animate-in fade-in duration-150">
                            <div>
                              <label className="text-[11px] text-[#94a3b8] block mb-0.5 leading-3">Matches</label>
                              <input
                                type="number"
                                value={form.matches}
                                onChange={(e) => { const val = parseInt(e.target.value) || 0; setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, matches: val } : p)); }}
                                className="w-full bg-[#141c2e] border border-[#2a3a5c] rounded-lg px-2 py-1 text-xs leading-4 text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-[#94a3b8] block mb-0.5 leading-3">Runs / Pts</label>
                              <input
                                type="number"
                                value={form.runs}
                                onChange={(e) => { const val = parseInt(e.target.value) || 0; setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, runs: val } : p)); }}
                                className="w-full bg-[#141c2e] border border-[#2a3a5c] rounded-lg px-2 py-1 text-xs leading-4 text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-[#94a3b8] block mb-0.5 leading-3">Wickets</label>
                              <input
                                type="number"
                                value={form.wickets}
                                onChange={(e) => { const val = parseInt(e.target.value) || 0; setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, wickets: val } : p)); }}
                                className="w-full bg-[#141c2e] border border-[#2a3a5c] rounded-lg px-2 py-1 text-xs leading-4 text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-[#94a3b8] block mb-0.5 leading-3">Strike Rate</label>
                              <input
                                type="number"
                                step="0.1"
                                value={form.strikeRate}
                                onChange={(e) => { const val = parseFloat(e.target.value) || 0; setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, strikeRate: val } : p)); }}
                                className="w-full bg-[#141c2e] border border-[#2a3a5c] rounded-lg px-2 py-1 text-xs leading-4 text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-[#94a3b8] block mb-0.5 leading-3">Avg Score</label>
                              <input
                                type="number"
                                step="0.1"
                                value={form.avgScore}
                                onChange={(e) => { const val = parseFloat(e.target.value) || 0; setAddPlayerForms(prev => prev.map(p => p.id === form.id ? { ...p, avgScore: val } : p)); }}
                                className="w-full bg-[#141c2e] border border-[#2a3a5c] rounded-lg px-2 py-1 text-xs leading-4 text-[#f1f5f9] focus:border-[#f97316] outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 px-4 sm:px-6 py-3 border-t border-[#2a3a5c] bg-[#141c2e] flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowAddPlayerModal(false)}
              className="w-full sm:w-auto sm:flex-1 py-2 px-4 bg-[#0c1220] border border-[#2a3a5c] text-[#94a3b8] text-xs sm:text-sm font-semibold leading-5 rounded-xl hover:border-[#ef4444] hover:text-[#ef4444] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || addPlayerForms.length === 0}
              className="w-full sm:w-auto sm:flex-[2] py-2 px-4 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold leading-5 rounded-xl border-none cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Registering {addPlayerForms.length} participant{addPlayerForms.length > 1 ? "s" : ""}...</>
                : `Register ${addPlayerForms.length} Participant${addPlayerForms.length > 1 ? "s" : ""} ↗`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
