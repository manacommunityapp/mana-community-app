import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Users, User, Heart, Sparkles, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { userService } from "../../../services/common/userService";
import type { UserResponse } from "../../../types/api";
import type { FamilyMember } from "../../../services/common/familyService";

export interface SelectedPartnerInfo {
  userId: number | null;
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
  communityId?: number;
  familyMembers?: FamilyMember[];
  disabled?: boolean;
}

export function SportsPartnerSelector({
  selectedPartner,
  onChange,
  matchType = "DOUBLES",
  currentGender,
  currentUserId,
  communityId,
  familyMembers = [],
  disabled = false,
}: SportsPartnerSelectorProps) {
  const [partnerMode, setPartnerMode] = useState<"community" | "family" | "open_pool">(
    selectedPartner?.mode || (selectedPartner?.userId ? "community" : "community")
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResponse[]>([]);
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

  // Debounced search for community users
  useEffect(() => {
    if (partnerMode !== "community" || !searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await userService.searchUsersGlobal(searchQuery.trim(), communityId);
        // Exclude current user from search results
        const filtered = results.filter(u => u.id !== currentUserId);
        setSearchResults(filtered);
      } catch (err) {
        console.warn("Failed to search community users:", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, partnerMode, communityId, currentUserId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCommunityUser = (u: UserResponse) => {
    const flat = u.flatNo || u.block ? `${u.block ? `Block ${u.block}, ` : ""}${u.flatNo || ""}` : "";
    onChange({
      userId: u.id,
      name: u.fullName || (u as any).name || "Resident",
      flatNumber: flat.trim() || undefined,
      gender: u.gender || undefined,
      email: u.email || undefined,
      phone: u.phone || undefined,
      mode: "community",
    });
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleSelectFamilyMember = (fm: FamilyMember) => {
    onChange({
      userId: null, // family member without direct user ID
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-[13px] sm:text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Doubles Partner</span>
              {isMixedDoubles && (
                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[9px] font-extrabold rounded uppercase tracking-wider">
                  Mixed Doubles
                </span>
              )}
            </h4>
            <p className="text-[11px] sm:text-[10px] text-slate-500">
              {isMixedDoubles
                ? "Mixed Doubles requires one Male and one Female player."
                : "Choose a teammate or request auto-pairing from the open pool."}
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        {!selectedPartner && (
          <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-[11px] sm:text-[10px] font-semibold">
            <button
              type="button"
              onClick={() => { setPartnerMode("community"); onChange(null); }}
              className={`px-2.5 sm:px-2 py-1.5 sm:py-1 min-h-[36px] sm:min-h-0 rounded-md transition cursor-pointer ${
                partnerMode === "community" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Neighbor
            </button>
            {familyMembers.length > 0 && (
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
                <span className="text-[13px] sm:text-xs font-bold text-slate-900 truncate">{selectedPartner.name}</span>
                {selectedPartner.gender && (
                  <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                    {selectedPartner.gender}
                  </span>
                )}
                {selectedPartner.mode === "open_pool" && (
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                    Open Pairing Pool
                  </span>
                )}
              </div>
              {selectedPartner.flatNumber && (
                <p className="text-[10px] text-slate-500 truncate">{selectedPartner.flatNumber}</p>
              )}
              {selectedPartner.mode !== "open_pool" && (
                <p className="text-[9.5px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
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
          {/* Mode 1: Community Search */}
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
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-30 divide-y divide-slate-100">
                  {searching ? (
                    <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching residents...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No matching neighbors found. Try searching by flat number (e.g. A-102).
                    </div>
                  ) : (
                    searchResults.map((u) => {
                      const fullName = u.fullName || (u as any).name || "Resident";
                      const flatInfo = u.flatNo || u.block ? `${u.block ? `Block ${u.block}, ` : ""}Flat ${u.flatNo || ""}` : "";
                      const isGenderMismatch = targetPartnerGender && u.gender && u.gender.toUpperCase() !== targetPartnerGender;

                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectCommunityUser(u)}
                          className="w-full p-2.5 min-h-[44px] sm:min-h-0 text-left hover:bg-indigo-50/50 flex items-center justify-between gap-2 transition cursor-pointer group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] sm:text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition truncate">
                                {fullName}
                              </span>
                              {u.gender && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  isGenderMismatch ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {u.gender}
                                </span>
                              )}
                            </div>
                            {flatInfo && (
                              <p className="text-[10px] text-slate-400 truncate">{flatInfo}</p>
                            )}
                          </div>
                          {isGenderMismatch ? (
                            <span className="text-[9px] text-amber-600 font-bold shrink-0 flex items-center gap-0.5">
                              <AlertCircle className="w-3 h-3" /> Gender Mismatch
                            </span>
                          ) : (
                            <span className="text-[10px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition shrink-0">
                              Select →
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Family Members Picker */}
          {partnerMode === "family" && (
            <div className="space-y-1.5">
              {familyMembers.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No family members registered yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {familyMembers.map((fm) => (
                    <button
                      key={fm.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSelectFamilyMember(fm)}
                      className="p-2.5 sm:p-2 min-h-[44px] sm:min-h-0 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-lg text-left transition flex items-center justify-between gap-2 cursor-pointer shadow-2xs"
                    >
                      <div className="min-w-0">
                        <span className="text-[13px] sm:text-xs font-semibold text-slate-800 block truncate">{fm.name}</span>
                        <span className="text-[10px] sm:text-[9px] text-slate-400 capitalize">{fm.relation} {fm.gender ? `• ${fm.gender}` : ""}</span>
                      </div>
                      <span className="text-[11px] sm:text-[10px] text-indigo-600 font-bold">Pick</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Open Pool Notice */}
          {partnerMode === "open_pool" && (
            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-[12px] sm:text-[11px] text-amber-800 leading-tight">
                You will register solo. The tournament organizers or auto-pairing system will pair you with another solo player before match draws are finalized.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
