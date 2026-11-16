import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  Users,
  Crown,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Building,
  Phone,
  Mail,
  Coins,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { sportsService } from "../../../../services/sports/sportsService";
import type { AuctionTeam } from "../../../../types/api";
import { getSportEmoji } from "./ViewPlayersModal";
import { formatFlatLabel } from "../../../../utils/sportsValidationUtils";
import {
  getSportName,
  getCategoryName,
  getAgeCategory,
  getDisplayEventFormats,
  getFormatBadge,
} from "./TournamentSection";

export interface ViewCaptainsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  nominatedCaptains?: AuctionTeam[];
  loadingCaptains?: boolean;
  onConfirmCaptain?: (teamId: number) => void;
  onRefresh?: () => void;
  onToggleNomination?: (eventId: number, open: boolean) => void;
}

export function ViewCaptainsModal({
  isOpen,
  onClose,
  event,
  nominatedCaptains = [],
  loadingCaptains = false,
  onConfirmCaptain,
  onRefresh,
  onToggleNomination,
}: ViewCaptainsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CONFIRMED" | "PENDING">("ALL");
  const [confirmingTeamId, setConfirmingTeamId] = useState<number | null>(null);
  const [isNomOpen, setIsNomOpen] = useState(Boolean(event?.captainNominationOpen));
  const [isTogglingNom, setIsTogglingNom] = useState(false);

  useEffect(() => {
    setIsNomOpen(Boolean(event?.captainNominationOpen));
  }, [event?.captainNominationOpen]);

  const handleToggleNomOpen = async () => {
    if (!event?.id) return;
    setIsTogglingNom(true);
    try {
      const nextState = !isNomOpen;
      await sportsService.setCaptainNominationOpen(event.id, nextState);
      setIsNomOpen(nextState);
      toast.success(`Captain nominations ${nextState ? "opened" : "stopped"}`);
      if (onToggleNomination) onToggleNomination(event.id, nextState);
      if (onRefresh) onRefresh();
    } catch {
      toast.error("Failed to update captain nominations status");
    } finally {
      setIsTogglingNom(false);
    }
  };

  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Counts
  const counts = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    for (const team of nominatedCaptains) {
      if (team.captainConfirmation) {
        confirmed++;
      } else {
        pending++;
      }
    }
    return {
      total: nominatedCaptains.length,
      confirmed,
      pending,
    };
  }, [nominatedCaptains]);

  // Filtered captains
  const filteredCaptains = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return nominatedCaptains.filter((team) => {
      // Status filter
      if (statusFilter === "CONFIRMED" && !team.captainConfirmation) return false;
      if (statusFilter === "PENDING" && team.captainConfirmation) return false;

      // Search query
      if (q) {
        const ownerName = (team.ownerName || team.ownerUser?.fullName || "").toLowerCase();
        const teamName = (team.teamName || "").toLowerCase();
        const flat = (team.ownerUser?.flatNumber || "").toLowerCase();
        const phone = (team.ownerUser?.phone || "").toLowerCase();
        const email = (team.ownerUser?.email || "").toLowerCase();
        const budget = String(team.totalBudget || "");

        const match =
          ownerName.includes(q) ||
          teamName.includes(q) ||
          flat.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          budget.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [nominatedCaptains, statusFilter, searchQuery]);

  if (!isOpen || !event) return null;

  const eventName = event.name || "Sports Event";
  const sportName = getSportName(event);
  const categoryName = getCategoryName(event);
  const ageCategory = getAgeCategory(event);
  const formats = getDisplayEventFormats(event);
  const sportEmoji = getSportEmoji(event);

  const handleConfirm = async (teamId: number) => {
    if (!onConfirmCaptain) return;
    setConfirmingTeamId(teamId);
    try {
      await onConfirmCaptain(teamId);
    } finally {
      setConfirmingTeamId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-4xl lg:max-w-5xl h-[88vh] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-left"
      >
        {/* Modal Header */}
        <div className="flex items-start sm:items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-gradient-to-r from-orange-50/70 via-white to-amber-50/60 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
            <div className="w-10 h-10 rounded-xl bg-white border border-orange-200/80 shadow-2xs flex items-center justify-center text-xl shrink-0">
              {sportEmoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate" title={eventName}>
                  {eventName}
                </h3>
                {categoryName && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100/80 shrink-0"
                    title={`Player Category: ${categoryName}`}
                  >
                    {categoryName}
                  </span>
                )}
                {ageCategory && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0"
                    title={`Age Category: ${ageCategory}`}
                  >
                    {ageCategory}
                  </span>
                )}
                {formats.map((fmt) => {
                  const badge = getFormatBadge(fmt);
                  return (
                    <span
                      key={fmt}
                      className={`text-[10px] border px-1.5 py-0.2 rounded font-bold tracking-wide shadow-2xs shrink-0 ${badge.color}`}
                      title={`Participant Format: ${badge.label}`}
                    >
                      {badge.label}
                    </span>
                  );
                })}
              </div>
              <div className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5 flex-wrap mt-0.5">
                {sportName && <span>{sportName}</span>}
                {event.tournamentName && <span>· {event.tournamentName}</span>}
                <span>·</span>
                <span className="font-semibold text-orange-600 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-500 inline" />
                  {counts.total} Nominated Captain{counts.total !== 1 ? "s" : ""}
                </span>
                <span className="text-slate-400">
                  ({counts.confirmed} confirmed · {counts.pending} pending)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loadingCaptains}
                className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                title="Refresh Nominated Captains"
              >
                <RefreshCw className={`w-4 h-4 ${loadingCaptains ? "animate-spin text-orange-600" : ""}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Toolbar: Header + Search + Status Filters */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              Captain Nominations
            </span>
            <span className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded font-bold bg-[#f97316]/15 text-[#f97316] border border-[#f97316]/30">
              {counts.total} captain{counts.total !== 1 ? "s" : ""}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
              isNomOpen
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isNomOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              {isNomOpen ? "Nominations OPEN" : "Nominations STOPPED"}
            </span>
            <button
              type="button"
              onClick={handleToggleNomOpen}
              disabled={isTogglingNom}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                isNomOpen
                  ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
              }`}
              title={isNomOpen ? "Stop captain nominations" : "Open captain nominations"}
            >
              {isTogglingNom ? "..." : isNomOpen ? "⏹ Stop Nominations" : "🏆 Open Nominations"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Bar */}
            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search captain, team, flat, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({counts.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("CONFIRMED")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  statusFilter === "CONFIRMED"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-emerald-700"
                }`}
              >
                Confirmed ({counts.confirmed})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PENDING")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  statusFilter === "PENDING"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-amber-700"
                }`}
              >
                Pending ({counts.pending})
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body: Scrollable Captains List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50">
          {loadingCaptains ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <p className="text-xs font-semibold">Loading nominated captains...</p>
            </div>
          ) : filteredCaptains.length > 0 ? (
            <div className="space-y-3">
              {filteredCaptains.map((team, idx) => {
                const captainName = team.ownerName || team.ownerUser?.fullName || "—";
                const isConfirmed = !!team.captainConfirmation;
                const flatNo = formatFlatLabel(team.ownerUser?.flatNumber || (team.ownerUser as any)?.flatNo, (team.ownerUser as any)?.block);
                const phone = team.ownerUser?.phone;
                const email = team.ownerUser?.email;

                return (
                  <div
                    key={team.id}
                    className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-orange-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                  >
                    {/* Captain & Team Information */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                          isConfirmed
                            ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                            : "bg-orange-50 border border-orange-200 text-orange-600"
                        }`}
                      >
                        {isConfirmed ? "👑" : idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 break-words">
                            {captainName}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              isConfirmed
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {isConfirmed ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Confirmed Captain
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                Nomination Pending
                              </>
                            )}
                          </span>
                        </div>

                        {/* Assigned / Proposed Team Name */}
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-500">Team:</span>
                          <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-lg tracking-wide">
                            {team.teamName || `${captainName}'s Team`}
                          </span>
                        </div>

                        {/* Contact & Meta info */}
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          {flatNo && (
                            <span className="flex items-center gap-1 font-medium">
                              <Building className="w-3 h-3 text-slate-400" />
                              {flatNo}
                            </span>
                          )}
                          {phone && (
                            <span className="flex items-center gap-1 font-medium">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {phone}
                            </span>
                          )}
                          {email && (
                            <span className="flex items-center gap-1 font-medium">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {email}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Coins className="w-3 h-3 text-amber-500" />
                            Budget: ₹{(team.totalBudget ?? 100000).toLocaleString("en-IN")}
                          </span>
                          {team.remainingBudget != null && team.remainingBudget !== team.totalBudget && (
                            <span className="text-slate-400">
                              (Rem: ₹{team.remainingBudget.toLocaleString("en-IN")})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions on right */}
                    <div className="flex items-center gap-2 sm:self-center shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 justify-end">
                      {isConfirmed ? (
                        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Confirmed ✓</span>
                        </div>
                      ) : onConfirmCaptain ? (
                        <button
                          type="button"
                          disabled={confirmingTeamId === team.id}
                          onClick={() => handleConfirm(team.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {confirmingTeamId === team.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Confirm Captain</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs my-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <Crown className="w-7 h-7 text-amber-500" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 mb-1">
                {searchQuery || statusFilter !== "ALL"
                  ? "No matching nominated captains"
                  : "No nominated captains yet"}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try clearing your search query or changing the filter to find captains."
                  : "Players can nominate themselves as captains from their registration card, or administrators can appoint captains using the Appoint Captain action."}
              </p>
              {(searchQuery || statusFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                  className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div>
            Showing <span className="font-bold text-slate-700">{filteredCaptains.length}</span> of{" "}
            <span className="font-bold text-slate-700">{counts.total}</span> captains
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
