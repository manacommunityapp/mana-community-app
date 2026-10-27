import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Users, User, Heart, Sparkles, Check, X, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { userService } from "../../../services/common/userService";
import { getStoredUser } from "../../../services/common/apiClient";
import type { PartnerCandidateResponse } from "../../../services/common/userService";
import type { FamilyMember } from "../../../services/common/familyService";

export interface SelectedPartnerInfo {
  userId: number | null;
  familyMemberId?: number | string;
  name?: string;
  flatNumber?: string;
  gender?: string;
  email?: string;
  phone?: string;
  mode: "community" | "family" | "open_pool";
}

interface SportsPartnerSelectorProps {
  selectedPartner?: SelectedPartnerInfo | null;
  onChange: (partner: SelectedPartnerInfo | null) => void;
  matchType?: string; // "DOUBLES" | "MIXED_DOUBLES" | string
  currentGender?: string;
  currentUserId?: number;
  currentFamilyMemberId?: number | string;
  currentUserName?: string;
  communityId?: number;
  familyMembers?: FamilyMember[];
  disabled?: boolean;
  /** Event ID used to compute server-side age/gender eligibility (optional). */
  eventId?: number | string | null;
  /** Minimum age of the event category — used for local family member eligibility display. */
  minAge?: number | null;
  /** Maximum age of the event category — used for local family member eligibility display. */
  maxAge?: number | null;
  /** When true, younger players can play up (only lower-bound enforced). Default true. */
  allowHigherAgeCategory?: boolean;
}

export function SportsPartnerSelector({
  selectedPartner,
  onChange,
  matchType = "DOUBLES",
  currentGender,
  currentUserId,
  currentFamilyMemberId,
  currentUserName,
  communityId,
  familyMembers = [],
  disabled = false,
  eventId,
  minAge,
  maxAge,
  allowHigherAgeCategory = true,
}: SportsPartnerSelectorProps) {
  const [partnerMode, setPartnerMode] = useState<"community" | "family" | "open_pool">(
    selectedPartner?.mode || "community"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PartnerCandidateResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isMixedDoubles = useMemo(() => {
    return (matchType || "").toUpperCase().includes("MIXED");
  }, [matchType]);

  const targetPartnerGender = useMemo(() => {
    if (!isMixedDoubles || !currentGender) return null;
    const g = currentGender.trim().toUpperCase();
    if (g === "MALE") return "FEMALE";
    if (g === "FEMALE") return "MALE";
    return null;
  }, [isMixedDoubles, currentGender]);

  // ── Local family member eligibility check ─────────────────────────────────
  const checkFamilyMemberEligibility = (fm: FamilyMember): { eligible: boolean; reason?: string } => {
    // Gender check for mixed doubles
    if (targetPartnerGender && fm.gender && fm.gender.toUpperCase() !== targetPartnerGender) {
      return { eligible: false, reason: `Need ${targetPartnerGender.toLowerCase()} partner` };
    }
    // Age check
    if (minAge != null || maxAge != null) {
      let fmAge: number | null = null;
      if (fm.dob) {
        const parsed = parseDobClient(fm.dob);
        if (parsed) {
          const today = new Date();
          let age = today.getFullYear() - parsed.getFullYear();
          if (
            today.getMonth() < parsed.getMonth() ||
            (today.getMonth() === parsed.getMonth() && today.getDate() < parsed.getDate())
          ) age--;
          fmAge = age >= 0 ? age : null;
        }
      }
      if (fmAge == null && fm.age != null) fmAge = fm.age;
      if (fmAge != null) {
        if (minAge != null && fmAge < minAge) {
          return { eligible: false, reason: `Age ${fmAge} — min ${minAge}` };
        }
        if (!allowHigherAgeCategory && maxAge != null && fmAge > maxAge) {
          return { eligible: false, reason: `Age ${fmAge} — max ${maxAge}` };
        }
      }
    }
    return { eligible: true };
  };

  const availableFamilyMembers = useMemo(() => {
    const seen = new Set<string>();
    const storedUser = getStoredUser();
    const effectiveUserId = currentUserId || (storedUser?.userId ? Number(storedUser.userId) : undefined);
    const effectiveUserName = currentUserName || storedUser?.fullName || (
      currentFamilyMemberId
        ? familyMembers.find(f => String(f.id) === String(currentFamilyMemberId))?.name
        : undefined
    );
    const normRegisteringName = effectiveUserName ? normalizeCandidateName(effectiveUserName) : "";

    return familyMembers.filter(fm => {
      // 1. Exclude the self logged-in person (relation "Self (Head)", id "fam-self", or matching logged-in user)
      if (isSelfFamilyMember(fm, effectiveUserId, currentUserName || storedUser?.fullName)) {
        return false;
      }

      // 2. Exclude if this is the family member currently registering
      if (currentFamilyMemberId && String(fm.id) === String(currentFamilyMemberId)) {
        return false;
      }
      if (normRegisteringName && normalizeCandidateName(fm.name) === normRegisteringName) {
        return false;
      }

      // 3. Deduplicate family members by id and name
      const idKey = `id-${fm.id}`;
      const nameKey = `name-${normalizeCandidateName(fm.name)}`;
      if (seen.has(idKey) || seen.has(nameKey)) return false;
      seen.add(idKey);
      seen.add(nameKey);
      return true;
    });
  }, [familyMembers, currentFamilyMemberId, currentUserId, currentUserName]);

  // ── Debounced unified partner search ─────────────────────────────────────
  useEffect(() => {
    if (partnerMode !== "community" || !searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await userService.searchPartners({
          communityId: communityId!,
          query: searchQuery.trim(),
          eventId: eventId ?? null,
          matchType,
          callerGender: currentGender,
        });
        const effectiveUserName = currentUserName || (
          currentFamilyMemberId
            ? familyMembers.find(f => String(f.id) === String(currentFamilyMemberId))?.name
            : undefined
        );
        // Deduplicate partner candidates from the same flat and exclude the self-registering member
        const deduplicated = deduplicatePartnerCandidates(
          results,
          currentUserId,
          currentFamilyMemberId,
          effectiveUserName
        );
        setSearchResults(deduplicated);
      } catch (err) {
        console.warn("Failed to search partners:", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, partnerMode, communityId, currentUserId, currentFamilyMemberId, currentUserName, familyMembers, eventId, matchType, currentGender]);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCandidate = (candidate: PartnerCandidateResponse) => {
    const isGenderMismatch = !!(targetPartnerGender && candidate.gender && candidate.gender.toUpperCase() !== targetPartnerGender);
    if (!candidate.eligible || isGenderMismatch) return;
    const flat = candidate.block && candidate.flatNo
      ? `${candidate.block}-${candidate.flatNo}`
      : candidate.flatNo || candidate.block || undefined;

    const formattedGender = candidate.gender
      ? candidate.gender.charAt(0).toUpperCase() + candidate.gender.slice(1).toLowerCase()
      : undefined;

    if (candidate.type === "FAMILY_MEMBER") {
      onChange({
        userId: candidate.primaryUserId ?? null,
        familyMemberId: candidate.id,
        name: candidate.name,
        flatNumber: flat,
        gender: formattedGender,
        mode: "family",
      });
    } else {
      onChange({
        userId: candidate.id,
        name: candidate.name,
        flatNumber: flat,
        gender: formattedGender,
        mode: "community",
      });
    }
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleSelectFamilyMember = (fm: FamilyMember) => {
    const elig = checkFamilyMemberEligibility(fm);
    if (!elig.eligible) return;
    onChange({
      userId: null,
      familyMemberId: fm.id,
      name: fm.name,
      flatNumber: undefined,
      gender: fm.gender,
      mode: "family",
    });
  };

  const handleSetOpenPool = () => {
    setPartnerMode("open_pool");
    onChange({
      userId: null,
      name: "Looking for Partner (Open Pool)",
      mode: "open_pool",
    });
  };

  const handleClearPartner = () => {
    onChange(null);
    setSearchQuery("");
    setPartnerMode("community");
  };

  return (
    <div ref={containerRef} className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 sm:p-4 space-y-3 text-left">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 m-0 mb-0">
              <span>Doubles Partner <span className="text-rose-500 font-bold">*</span></span>
              {isMixedDoubles && (
                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[10px] font-extrabold rounded uppercase tracking-wider">
                  Mixed Doubles
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 m-0">
              {isMixedDoubles
                ? targetPartnerGender
                  ? `Mixed Doubles requires a ${targetPartnerGender.toLowerCase()} partner (1 Male + 1 Female).`
                  : "Mixed Doubles requires one Male and one Female player."
                : "Choose a teammate from your community or request auto-pairing."}
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        {!selectedPartner && (
          <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setPartnerMode("community"); onChange(null); }}
              className={`px-2.5 sm:px-2 py-1.5 sm:py-1 min-h-[36px] sm:min-h-0 rounded-md transition cursor-pointer ${
                partnerMode === "community" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Neighbor
            </button>
            {availableFamilyMembers.length > 0 && (
              <button
                type="button"
                onClick={() => { setPartnerMode("family"); onChange(null); }}
                className={`px-2.5 sm:px-2 py-1.5 sm:py-1 min-h-[36px] sm:min-h-0 rounded-md transition cursor-pointer ${
                  partnerMode === "family" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Family
              </button>
            )}
            <button
              type="button"
              onClick={handleSetOpenPool}
              className={`px-2.5 sm:px-2 py-1.5 sm:py-1 min-h-[36px] sm:min-h-0 rounded-md transition cursor-pointer ${
                partnerMode === "open_pool" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Need Partner
            </button>
          </div>
        )}
      </div>

      {/* When a Partner is already selected */}
      {selectedPartner ? (
        <div className="bg-white border border-indigo-200 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
              {selectedPartner.mode === "open_pool" ? (
                <Sparkles className="w-4 h-4 text-amber-500" />
              ) : selectedPartner.mode === "family" ? (
                <Heart className="w-4 h-4 text-rose-500" />
              ) : (
                selectedPartner.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] text-[10px] font-bold text-slate-900 truncate">{selectedPartner.name}</span>
                {selectedPartner.gender && (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                    {selectedPartner.gender}
                  </span>
                )}
                {selectedPartner.mode === "open_pool" && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                    Open Pairing Pool
                  </span>
                )}
              </div>
              {selectedPartner.flatNumber && (
                <p className="text-xs text-slate-500 truncate">{selectedPartner.flatNumber}</p>
              )}
              {selectedPartner.mode !== "open_pool" && (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  An invite will be dispatched upon registration
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={handleClearPartner}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
            title="Remove partner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Partner Selection Views */
        <div>
          {/* Mode 1: Community Search (unified — includes family members of neighbors) */}
          {partnerMode === "community" && (
            <div className="relative">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  disabled={disabled}
                  value={searchQuery}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  placeholder="Search neighbor by name or flat number..."
                  className="w-full h-[36px] sm:h-[34px] pl-8 pr-8 bg-white border border-slate-200 rounded-lg text-[13px] sm:text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
                {searching && (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {isDropdownOpen && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto z-30 divide-y divide-slate-100">
                  {searching ? (
                    <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching community members…
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No matching community members found. Try a different name or flat number.
                    </div>
                  ) : (
                    searchResults.map((candidate) => {
                      const isGenderMismatch = !!(targetPartnerGender && candidate.gender && candidate.gender.toUpperCase() !== targetPartnerGender);
                      const isIneligible = !candidate.eligible || isGenderMismatch;
                      const isFamilyMember = candidate.type === "FAMILY_MEMBER";

                      return (
                        <button
                          key={`${candidate.type}-${candidate.id}`}
                          type="button"
                          disabled={disabled || isIneligible}
                          onClick={() => handleSelectCandidate(candidate)}
                          className={`w-full p-2.5 min-h-[44px] sm:min-h-0 text-left flex items-center justify-between gap-2 transition ${
                            isIneligible
                              ? "opacity-55 cursor-not-allowed bg-slate-50/70"
                              : "hover:bg-indigo-50/50 cursor-pointer group"
                          }`}
                          title={isGenderMismatch ? `Mixed Doubles requires a ${targetPartnerGender?.toLowerCase()} partner` : isIneligible ? candidate.ineligibilityReason || "Ineligible" : undefined}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Family member icon */}
                              {isFamilyMember && (
                                <Heart className="w-3 h-3 text-rose-400 shrink-0" />
                              )}
                              <span className={`text-[13px] sm:text-[11px] font-semibold truncate ${isIneligible ? "text-slate-500" : "text-slate-900 group-hover:text-indigo-600"}`}>
                                {candidate.name}
                              </span>
                              {/* Age badge */}
                              {candidate.age != null && (
                                <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                                  {candidate.age}y
                                </span>
                              )}
                              {/* Gender badge */}
                              {candidate.gender && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  isIneligible ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {candidate.gender === "MALE" ? "M" : candidate.gender === "FEMALE" ? "F" : candidate.gender}
                                </span>
                              )}
                            </div>
                            {/* Occupancy label (Owner · Flat A-402 / Family (Son) · Flat B-201) */}
                            {candidate.occupancyLabel && (
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{candidate.occupancyLabel}</p>
                            )}
                          </div>

                          {/* Right badge: eligible / ineligible */}
                          {isGenderMismatch ? (
                            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold shrink-0 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                              Need {targetPartnerGender}
                            </span>
                          ) : isIneligible ? (
                            <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-bold shrink-0 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                              {candidate.ineligibilityReason || "Ineligible"}
                            </span>
                          ) : (
                            <span className="text-[10px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition shrink-0 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Select →
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Hint below search */}
              {!isDropdownOpen && (
                <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">
                  Searches flat owners, tenants, and their family members · Age and gender eligibility checked automatically
                </p>
              )}
            </div>
          )}

          {/* Mode 2: Family Members Picker (current user's own family members) */}
          {partnerMode === "family" && (
            <div className="space-y-1.5">
              {availableFamilyMembers.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  {familyMembers.length > 0 ? "No other family members available." : "No family members registered yet."}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {availableFamilyMembers.map((fm) => {
                    const elig = checkFamilyMemberEligibility(fm);
                    const isIneligible = !elig.eligible;

                    // Compute display age
                    let displayAge: number | null = null;
                    if (fm.dob) {
                      const parsed = parseDobClient(fm.dob);
                      if (parsed) {
                        const today = new Date();
                        let age = today.getFullYear() - parsed.getFullYear();
                        if (today.getMonth() < parsed.getMonth() || (today.getMonth() === parsed.getMonth() && today.getDate() < parsed.getDate())) age--;
                        if (age >= 0) displayAge = age;
                      }
                    }
                    if (displayAge == null && fm.age != null) displayAge = fm.age;

                    return (
                      <button
                        key={fm.id}
                        type="button"
                        disabled={disabled || isIneligible}
                        onClick={() => !isIneligible && handleSelectFamilyMember(fm)}
                        className={`p-2.5 sm:p-2 min-h-[44px] sm:min-h-0 bg-white border rounded-lg text-left transition flex items-center justify-between gap-2 shadow-2xs ${
                          isIneligible
                            ? "border-slate-200 opacity-55 cursor-not-allowed bg-slate-50/70"
                            : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer"
                        }`}
                        title={isIneligible ? elig.reason : undefined}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[13px] sm:text-[11px] font-semibold block truncate ${isIneligible ? "text-slate-500" : "text-slate-800"}`}>
                              {fm.name}
                            </span>
                            {displayAge != null && (
                              <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">{displayAge}y</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {fm.relation} {fm.gender ? `• ${fm.gender}` : ""}
                          </span>
                        </div>
                        {isIneligible ? (
                          <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-bold shrink-0 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            <span className="hidden sm:inline">{elig.reason}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-indigo-600 font-bold">Pick</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Open Pool Notice */}
          {partnerMode === "open_pool" && (
            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-[12px] sm:text-xs text-amber-800 leading-tight">
                You will register solo. The tournament organizers or auto-pairing system will pair you with another solo player before match draws are finalized.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Client-side DOB parser (mirrors backend parseDob logic) ─────────────────
function parseDobClient(dob: string): Date | null {
  if (!dob) return null;
  // yyyy-MM-dd
  const ymd = dob.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymd) {
    const d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    if (!isNaN(d.getTime())) return d;
  }
  // dd-MM-yyyy or dd/MM/yyyy
  const dmy = dob.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    if (!isNaN(d.getTime())) return d;
  }
  const fallback = new Date(dob);
  return !isNaN(fallback.getTime()) ? fallback : null;
}

// ── Candidate normalization & deduplication helpers ─────────────────────────

export function normalizeCandidateName(name?: string | null): string {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function isSelfFamilyMember(
  fm: FamilyMember,
  currentUserId?: number,
  currentUserName?: string
): boolean {
  if (fm.id === "fam-self" || String(fm.id).toLowerCase() === "fam-self") {
    return true;
  }
  const rel = (fm.relation || "").trim().toLowerCase();
  if (
    rel.includes("self") ||
    rel.includes("head") ||
    rel === "primary" ||
    rel.startsWith("primary ")
  ) {
    return true;
  }
  const storedUser = getStoredUser();
  const effectiveUserId = currentUserId || (storedUser?.userId ? Number(storedUser.userId) : undefined);
  if (effectiveUserId && fm.userId && Number(fm.userId) === effectiveUserId) {
    return true;
  }
  const effectiveUserName = currentUserName || storedUser?.fullName;
  if (effectiveUserName && normalizeCandidateName(fm.name) === normalizeCandidateName(effectiveUserName)) {
    return true;
  }
  if (storedUser?.email && fm.email && fm.email.trim().toLowerCase() === storedUser.email.trim().toLowerCase()) {
    return true;
  }
  return false;
}

export function normalizeCandidateFlat(candidate: { block?: string | null; flatNo?: string | null }): string {
  const block = (candidate.block || "").trim().toLowerCase();
  const flat = (candidate.flatNo || "").trim().toLowerCase();
  if (block && flat) {
    if (flat.startsWith(block)) return flat;
    return `${block}-${flat}`;
  }
  return flat || block || "";
}

/**
 * Deduplicates candidate results when searching for a partner by name or flat number.
 * 1. Excludes the current player registering (both as user account and as family member self).
 * 2. Deduplicates multiple results from the same flat:
 *    - Resolves AppUser vs FamilyMember duplicates for the same resident.
 *    - Eliminates duplicate family member entries from the same flat.
 *    - Merges missing metadata (age, gender, labels) into the surviving candidate.
 */
export function deduplicatePartnerCandidates(
  results: PartnerCandidateResponse[],
  currentUserId?: number,
  currentFamilyMemberId?: number | string,
  currentUserName?: string
): PartnerCandidateResponse[] {
  const normCurrentUserName = currentUserName ? normalizeCandidateName(currentUserName) : "";

  // 1. Filter out the currently registering player (self)
  const nonSelfResults = results.filter((r) => {
    // If registering as self (currentUserId provided, and not registering for a family member)
    if (currentUserId && !currentFamilyMemberId) {
      if (r.type === "USER" && r.id === currentUserId) {
        return false;
      }
      if (r.type === "FAMILY_MEMBER") {
        const rel = (r.relation || "").trim().toLowerCase();
        if ((rel.includes("self") || rel.includes("head")) && r.primaryUserId === currentUserId) {
          return false;
        }
        if (normCurrentUserName && normalizeCandidateName(r.name) === normCurrentUserName && r.primaryUserId === currentUserId) {
          return false;
        }
      }
    }

    // If registering for a family member (currentFamilyMemberId provided)
    if (currentFamilyMemberId) {
      if (r.type === "FAMILY_MEMBER" && r.id === Number(currentFamilyMemberId)) {
        return false;
      }
      if (normCurrentUserName && normalizeCandidateName(r.name) === normCurrentUserName && r.type === "FAMILY_MEMBER") {
        return false;
      }
    }

    return true;
  });

  // 2. Deduplicate:
  // - Eliminate duplicate entity IDs from SQL joins (same type & id)
  // - Deduplicate identical persons from the same flat (USER vs FAMILY_MEMBER, or duplicate FAMILY_MEMBER records)
  const map = new Map<string, PartnerCandidateResponse>();
  const seenEntityKeys = new Set<string>();

  for (const candidate of nonSelfResults) {
    const entityKey = `${candidate.type}-${candidate.id}`;
    if (seenEntityKeys.has(entityKey)) {
      continue;
    }
    seenEntityKeys.add(entityKey);

    const normName = normalizeCandidateName(candidate.name);
    const normFlat = normalizeCandidateFlat(candidate);
    const personKey = normFlat && normName ? `${normName}|${normFlat}` : normName ? `name-${normName}` : entityKey;

    if (!map.has(personKey)) {
      map.set(personKey, candidate);
    } else {
      const existing = map.get(personKey)!;
      let shouldReplace = false;

      // Rule 1: Prefer eligible over ineligible
      if (candidate.eligible && !existing.eligible) {
        shouldReplace = true;
      } else if (existing.eligible && !candidate.eligible) {
        shouldReplace = false;
      } else {
        // Rule 2: Prefer USER over FAMILY_MEMBER (primary account with direct phone/login)
        if (candidate.type === "USER" && existing.type === "FAMILY_MEMBER") {
          shouldReplace = true;
        } else if (existing.type === "USER" && candidate.type === "FAMILY_MEMBER") {
          shouldReplace = false;
        } else {
          // Rule 3: Prefer record with more complete metadata
          const candScore = (candidate.age != null ? 1 : 0) + (candidate.gender ? 1 : 0) + (candidate.occupancyLabel ? 1 : 0);
          const existScore = (existing.age != null ? 1 : 0) + (existing.gender ? 1 : 0) + (existing.occupancyLabel ? 1 : 0);
          if (candScore > existScore) {
            shouldReplace = true;
          }
        }
      }

      if (shouldReplace) {
        map.set(personKey, {
          ...candidate,
          age: candidate.age ?? existing.age,
          gender: candidate.gender || existing.gender,
          flatNo: candidate.flatNo || existing.flatNo,
          block: candidate.block || existing.block,
          occupancyLabel: candidate.occupancyLabel || existing.occupancyLabel,
        });
      } else {
        map.set(personKey, {
          ...existing,
          age: existing.age ?? candidate.age,
          gender: existing.gender || candidate.gender,
          flatNo: existing.flatNo || candidate.flatNo,
          block: existing.block || candidate.block,
          occupancyLabel: existing.occupancyLabel || candidate.occupancyLabel,
        });
      }
    }
  }

  return Array.from(map.values());
}
