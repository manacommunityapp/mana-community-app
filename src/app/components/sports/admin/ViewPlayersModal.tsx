import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  Users,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  XCircle,
  Plus,
  History,
  Loader2,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import type { TournamentRegistration } from "../../../../types/api";
import { sportsRankingService } from "../../../../services/sports/sportsRankingService";
import { sportsService } from "../../../../services/sports/sportsService";
import { showError, showSuccess } from "../../../../utils/ToastUtils";
import {
  exportPlayersToCSV,
  exportPlayersToExcel,
  exportPlayersToPDF,
} from "../../../../utils/sportsExportUtils";
import { PREDEFINED_SPORTS } from "../utils/sportsConstants";
import { ExternalFormsManager } from "./external-forms/ExternalFormsManager";
import {
  groupRegistrationsByPlayer,
  getSportName,
  getCategoryName,
  getAgeCategory,
  getDisplayEventFormats,
  getFormatBadge,
} from "./TournamentSection";

export interface ViewPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  registrations?: TournamentRegistration[];
  loadingRegs?: boolean;
  onConfirmRegistration?: (regId: number) => void;
  onRejectRegistration?: (regId: number) => void;
  onAddParticipant?: (eventId: number) => void;
  onImportParticipants?: (eventId: number) => void;
  onRefresh?: () => void;
}

export function getSportEmoji(ev: any): string {
  const sName = getSportName(ev);
  if (sName) {
    const match = PREDEFINED_SPORTS.find(
      (ps) => ps.name.toLowerCase() === sName.toLowerCase()
    );
    if (match?.icon) return match.icon;
  }
  const nameLower = (ev?.name || "").toLowerCase();
  for (const ps of PREDEFINED_SPORTS) {
    if (ps.name && nameLower.includes(ps.name.toLowerCase())) {
      return ps.icon;
    }
  }
  if (nameLower.includes("football") || nameLower.includes("soccer")) return "⚽";
  if (nameLower.includes("cricket")) return "🏏";
  if (nameLower.includes("tennis") && !nameLower.includes("table tennis")) return "🎾";
  if (nameLower.includes("badminton")) return "🏸";
  if (nameLower.includes("table tennis") || nameLower.includes("ping pong") || nameLower.includes("tt ")) return "🏓";
  if (nameLower.includes("volleyball")) return "🏐";
  if (nameLower.includes("basketball")) return "🏀";
  if (nameLower.includes("chess")) return "♟️";
  if (nameLower.includes("carrom")) return "🎯";
  if (nameLower.includes("swimming")) return "🏊";
  return "🏆";
}

export function ViewPlayersModal({
  isOpen,
  onClose,
  event,
  registrations = [],
  loadingRegs = false,
  onConfirmRegistration,
  onRejectRegistration,
  onAddParticipant,
  onImportParticipants,
  onRefresh,
}: ViewPlayersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [showExternalForms, setShowExternalForms] = useState(false);
  const [seedDrafts, setSeedDrafts] = useState<Record<number, string>>({});
  const [savingSeeds, setSavingSeeds] = useState<Record<number, boolean>>({});
  const [expandedHistoryKeys, setExpandedHistoryKeys] = useState<Record<string, boolean>>({});
  const [lazyHistoryMap, setLazyHistoryMap] = useState<Record<number, TournamentRegistration[]>>({});
  const [loadingHistoryMap, setLoadingHistoryMap] = useState<Record<number, boolean>>({});

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

  // Group all registrations
  const allGrouped = useMemo(() => {
    return groupRegistrationsByPlayer(registrations);
  }, [registrations]);

  const hasPlayers = Boolean(registrations && registrations.length > 0);

  // Calculate summary counts
  const counts = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    let withdrawn = 0;
    let rejected = 0;
    for (const group of allGrouped) {
      const s = group.primary.status;
      if (s === "CONFIRMED") confirmed++;
      else if (s === "PENDING" || s === "REGISTERED") pending++;
      else if (s === "WITHDRAWN") withdrawn++;
      else if (s === "REJECTED") rejected++;
    }
    return {
      total: allGrouped.length,
      rawTotal: registrations.length,
      confirmed,
      pending,
      withdrawn,
      rejected,
    };
  }, [allGrouped, registrations]);

  // Filter grouped registrations based on search query & status filter
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allGrouped.filter((group) => {
      const reg = group.primary;

      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "CONFIRMED" && reg.status !== "CONFIRMED") return false;
        if (
          statusFilter === "PENDING" &&
          reg.status !== "PENDING" &&
          reg.status !== "REGISTERED"
        )
          return false;
        if (statusFilter === "WITHDRAWN" && reg.status !== "WITHDRAWN") return false;
        if (statusFilter === "REJECTED" && reg.status !== "REJECTED") return false;
      }

      // Search query
      if (q) {
        const pName = (reg.playerName || reg.user?.fullName || "").toLowerCase();
        const flat = (reg.flatNumber || "").toLowerCase();
        const phone = (reg.phone || "").toLowerCase();
        const email = (reg.email || reg.user?.email || "").toLowerCase();
        const cat = (reg.category?.name || "").toLowerCase();
        const partner = (
          reg.partnerName ||
          reg.partner?.fullName ||
          reg.partner?.name ||
          ""
        ).toLowerCase();
        const match =
          pName.includes(q) ||
          flat.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          cat.includes(q) ||
          partner.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [allGrouped, statusFilter, searchQuery]);

  if (!isOpen || !event) return null;

  const eventName = event.name || "Sports Event";
  const sportName = getSportName(event);
  const categoryName = getCategoryName(event);
  const ageCategory = getAgeCategory(event);
  const formats = getDisplayEventFormats(event);
  const sportEmoji = getSportEmoji(event);

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-[#eab308]/20 text-[#eab308]";
      case "REGISTERED":
        return "bg-[#f97316]/20 text-[#f97316]";
      case "CONFIRMED":
        return "bg-[#10b981]/20 text-[#10b981]";
      case "WITHDRAWN":
        return "bg-[#ef4444]/20 text-[#ef4444]";
      case "REJECTED":
        return "bg-[#ef4444]/20 text-[#ef4444]";
      default:
        return "bg-[#475569]/20 text-[#94a3b8]";
    }
  };

  const handleSeedSave = async (regId: number) => {
    const raw = seedDrafts[regId];
    if (raw === undefined) return;
    const seed = raw === "" ? null : Number(raw);
    if (raw !== "" && (isNaN(seed!) || seed! < 1)) return;
    setSavingSeeds((prev) => ({ ...prev, [regId]: true }));
    try {
      await sportsRankingService.setRegistrationSeed(regId, seed);
      showSuccess("Seed updated");
    } catch {
      showError("Failed to update seed");
    } finally {
      setSavingSeeds((prev) => ({ ...prev, [regId]: false }));
    }
  };

  const handleToggleHistory = async (
    groupKey: string,
    eventId: number,
    primaryRegId: number,
    localHistory: TournamentRegistration[]
  ) => {
    const isCurrentlyExpanded = !!expandedHistoryKeys[groupKey];
    if (isCurrentlyExpanded) {
      setExpandedHistoryKeys((prev) => ({ ...prev, [groupKey]: false }));
      return;
    }

    setExpandedHistoryKeys((prev) => ({ ...prev, [groupKey]: true }));

    if (lazyHistoryMap[primaryRegId]) {
      return;
    }

    setLoadingHistoryMap((prev) => ({ ...prev, [primaryRegId]: true }));
    try {
      const fetched = await sportsService.getRegistrationHistory(
        eventId,
        primaryRegId
      );
      if (fetched && Array.isArray(fetched) && fetched.length > 0) {
        setLazyHistoryMap((prev) => ({ ...prev, [primaryRegId]: fetched }));
      } else {
        setLazyHistoryMap((prev) => ({ ...prev, [primaryRegId]: localHistory }));
      }
    } catch {
      setLazyHistoryMap((prev) => ({ ...prev, [primaryRegId]: localHistory }));
    } finally {
      setLoadingHistoryMap((prev) => ({ ...prev, [primaryRegId]: false }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl h-[94vh] max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-left"
      >
        {/* Modal Header */}
        <div className="flex items-start sm:items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-xl shrink-0">
              {sportEmoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="text-sm sm:text-base font-extrabold text-slate-900 truncate"
                  title={eventName}
                >
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
                <span className="font-semibold text-indigo-600">
                  {counts.total} registered player{counts.total !== 1 ? "s" : ""}
                </span>
                {counts.rawTotal > counts.total && (
                  <span className="text-slate-400">
                    ({counts.rawTotal} total records)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loadingRegs}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                title="Refresh Player Registrations"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingRegs ? "animate-spin text-indigo-600" : ""}`}
                />
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

        {/* Section Header: "Registered Players" count and action buttons */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest">
              Registered Players
            </span>
            <span className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded font-bold bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/30">
              {counts.total === counts.rawTotal
                ? `${counts.total} players`
                : `${counts.total} players (${counts.rawTotal} total records)`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export Players */}
            <div className="relative">
              <button
                type="button"
                disabled={!hasPlayers}
                onClick={() => hasPlayers && setExportDropdownOpen(!exportDropdownOpen)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
                  hasPlayers
                    ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 cursor-pointer shadow-xs"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 shadow-none"
                }`}
                title={hasPlayers ? "Export players to Excel, CSV, or PDF" : "No players available to export"}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Players</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {hasPlayers && exportDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-50"
                    onClick={() => setExportDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-left text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        exportPlayersToExcel(registrations || [], eventName);
                        setExportDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Download Excel (.xls)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportPlayersToCSV(registrations || [], eventName);
                        setExportDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Download CSV (.csv)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportPlayersToPDF(registrations || [], eventName);
                        setExportDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Printer className="w-4 h-4 text-indigo-600" />
                      <span>Print / Save PDF Roster</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Add Participant */}
            <button
              type="button"
              onClick={() => onAddParticipant?.(event.id)}
              className="px-3 py-1.5 bg-[#f97316]/10 hover:bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30 hover:border-[#f97316]/50 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Add participants to this sports event"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Participant</span>
            </button>

            {/* Import */}
            <button
              type="button"
              onClick={() => onImportParticipants?.(event.id)}
              className="px-3 py-1.5 bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 hover:border-[#10b981]/50 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Import participants via CSV"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>

            {/* External Forms */}
            <button
              type="button"
              onClick={() => setShowExternalForms(!showExternalForms)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border shadow-xs ${
                showExternalForms
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
              }`}
              title="Google Forms & External Registration Integration"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>External Forms</span>
            </button>
          </div>
        </div>

        {/* Search & Status Filter row */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-2.5 flex-shrink-0">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search players by name, flat, phone, partner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400 focus:bg-white transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                statusFilter === "ALL"
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("CONFIRMED")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                statusFilter === "CONFIRMED"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              Confirmed ({counts.confirmed})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PENDING")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                statusFilter === "PENDING"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              Pending ({counts.pending})
            </button>
            {counts.withdrawn > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter("WITHDRAWN")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                  statusFilter === "WITHDRAWN"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                }`}
              >
                Withdrawn ({counts.withdrawn})
              </button>
            )}
            {counts.rejected > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter("REJECTED")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                  statusFilter === "REJECTED"
                    ? "bg-red-600 text-white shadow-2xs"
                    : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                }`}
              >
                Rejected ({counts.rejected})
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50">
          {/* External forms panel */}
          {showExternalForms && (
            <div className="mb-4">
              <ExternalFormsManager
                event={event}
                onRefreshRegistrations={() => onRefresh && onRefresh()}
              />
            </div>
          )}

          {/* Loading indicator */}
          {loadingRegs && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
              <p className="text-xs text-slate-500 font-medium">
                Loading registered players...
              </p>
            </div>
          )}

          {/* Empty state: No registrations at all */}
          {!loadingRegs && allGrouped.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 gap-3 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
              <div className="flex items-center justify-center w-14 h-14 border border-slate-200 rounded-full bg-slate-50 shadow-inner">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h6 className="text-sm font-bold text-slate-800">
                  No Players Registered Yet
                </h6>
                <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                  Participants have not registered for this event yet. You can manually add participants or import them from CSV.
                </p>
              </div>
              {onAddParticipant && onImportParticipants && (
                <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => onAddParticipant(event.id)}
                    className="px-4 py-2 border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Participants
                  </button>
                  <span className="text-slate-400 font-semibold text-[10px]">
                    OR
                  </span>
                  <button
                    type="button"
                    onClick={() => onImportParticipants(event.id)}
                    className="px-4 py-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4" /> Import Participants
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty state: Filter returned 0 results */}
          {!loadingRegs && allGrouped.length > 0 && filteredGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 gap-2 bg-white rounded-xl border border-dashed border-slate-200 text-center">
              <Search className="w-6 h-6 text-slate-400 mb-1" />
              <h6 className="text-xs font-bold text-slate-800">
                No matching players found
              </h6>
              <p className="text-xs text-slate-500">
                Try adjusting your search query or status filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Players List Cards */}
          {!loadingRegs && filteredGroups.length > 0 && (
            <div className="space-y-2.5">
              {filteredGroups.map((group, idx) => {
                const reg = group.primary;
                const isHistoryExpanded = !!expandedHistoryKeys[group.key];

                return (
                  <div key={group.key} className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs transition-all hover:border-indigo-200 hover:shadow-xs">
                      {/* Left: Player Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 break-words">
                              {reg.playerName || reg.user?.fullName || "—"}
                            </span>
                            {reg.registrationSource === "GOOGLE_FORMS" && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-semibold border border-purple-200">
                                Google Form
                              </span>
                            )}
                            {reg.isExternalGuest && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 font-semibold border border-amber-200">
                                Guest
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            {reg.category?.name && (
                              <span className="font-medium text-slate-700">
                                {reg.category.name}
                              </span>
                            )}
                            {reg.age && <span>Age: {reg.age}</span>}
                            {reg.flatNumber && <span>Flat: {reg.flatNumber}</span>}
                            {reg.relation && <span>({reg.relation})</span>}
                            {reg.phone && <span>· Ph: {reg.phone}</span>}
                            {reg.registeredAt && (
                              <span>
                                · {format(new Date(reg.registeredAt), "MMM d, h:mm a")}
                              </span>
                            )}
                          </div>

                          {/* Doubles / Mixed Doubles Partner Display */}
                          {(() => {
                            const partnerName =
                              reg.partnerName ||
                              reg.partner?.fullName ||
                              reg.partner?.name ||
                              reg.partnerFamilyMember?.name;
                            const partnerFlat =
                              reg.partnerFlatNumber || reg.partner?.flatNo;
                            const partnerPhone =
                              reg.partnerPhone || reg.partner?.phone;
                            const rawPartnerStatus = (
                              reg.partnerConfirmationStatus ||
                              reg.partnerStatus ||
                              ""
                            ).toUpperCase();
                            const isConfirmed =
                              rawPartnerStatus === "CONFIRMED" ||
                              rawPartnerStatus === "ACCEPTED";
                            const isDeclined =
                              rawPartnerStatus === "DECLINED" ||
                              rawPartnerStatus === "REJECTED";
                            const isDoublesEvent = Boolean(
                              (reg.matchType &&
                                reg.matchType.toUpperCase().includes("DOUBLES")) ||
                              (reg.matchFormat &&
                                reg.matchFormat.toUpperCase().includes("DOUBLES")) ||
                              (event.name &&
                                event.name.toLowerCase().includes("doubles")) ||
                              (reg.category?.name &&
                                reg.category.name.toLowerCase().includes("doubles")) ||
                              partnerName ||
                              reg.partnerUserId ||
                              (reg as any).partnerFamilyMemberId
                            );

                            if (partnerName) {
                              return (
                                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-800 bg-indigo-50/80 border border-indigo-200/80 px-2 py-0.5 rounded-md w-fit flex-wrap">
                                  <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span>
                                    Partner:{" "}
                                    <strong className="font-semibold text-indigo-950">
                                      {partnerName}
                                    </strong>
                                    {partnerFlat ? ` · Flat ${partnerFlat}` : ""}
                                    {partnerPhone ? ` · Ph: ${partnerPhone}` : ""}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                                      isConfirmed
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                        : isDeclined
                                        ? "bg-rose-100 text-rose-800 border-rose-300"
                                        : "bg-amber-100 text-amber-800 border-amber-300"
                                    }`}
                                  >
                                    {isConfirmed
                                      ? "Partner Confirmed"
                                      : isDeclined
                                      ? "Partner Declined"
                                      : "Partner Invited"}
                                  </span>
                                </div>
                              );
                            }

                            if (isDoublesEvent) {
                              return (
                                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-purple-800 bg-purple-50/80 border border-purple-200/80 px-2 py-0.5 rounded-md w-fit">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                  <span className="font-medium">
                                    Open Pairing Pool (Partner Not Assigned)
                                  </span>
                                </div>
                              );
                            }

                            return null;
                          })()}
                        </div>
                      </div>

                      {/* Right: Actions, Seed, Status */}
                      <div className="flex flex-wrap items-center gap-2 sm:shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        {/* Seed Input */}
                        <div className="flex items-center gap-1 mr-1">
                          <span className="text-[10px] text-slate-400 font-medium">
                            Seed
                          </span>
                          <input
                            type="number"
                            min={1}
                            value={
                              seedDrafts[reg.id] ??
                              (reg.seed != null ? String(reg.seed) : "")
                            }
                            onChange={(e) =>
                              setSeedDrafts((prev) => ({
                                ...prev,
                                [reg.id]: e.target.value,
                              }))
                            }
                            onBlur={() => handleSeedSave(reg.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.currentTarget.blur();
                                handleSeedSave(reg.id);
                              }
                            }}
                            placeholder="—"
                            className="w-12 text-center border border-slate-200 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-indigo-200 focus:outline-none tabular-nums disabled:opacity-50"
                            disabled={!!savingSeeds[reg.id]}
                          />
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] px-2 py-1 rounded font-medium ${statusBadge(
                            reg.status
                          )}`}
                        >
                          {reg.status}
                        </span>

                        {/* History Trigger */}
                        {group.history.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleHistory(
                                group.key,
                                event.id,
                                reg.id,
                                group.history
                              )
                            }
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isHistoryExpanded
                                ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                            }`}
                            title={`View ${group.history.length} past registration records`}
                          >
                            {loadingHistoryMap[reg.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                            ) : (
                              <History className="w-3.5 h-3.5" />
                            )}
                            <span>History ({group.history.length})</span>
                            <ChevronDown
                              className={`w-3 h-3 transition-transform duration-200 ${
                                isHistoryExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        )}

                        {/* Action buttons */}
                        {(reg.status === "REGISTERED" || reg.status === "PENDING") &&
                          onConfirmRegistration && (
                            <button
                              type="button"
                              onClick={() => onConfirmRegistration(reg.id)}
                              className="text-xs px-3 py-1.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 rounded-lg hover:bg-[#10b981]/20 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Confirm
                            </button>
                          )}
                        {(reg.status === "REGISTERED" || reg.status === "PENDING") &&
                          onRejectRegistration && (
                            <button
                              type="button"
                              onClick={() => onRejectRegistration(reg.id)}
                              className="text-xs px-3 py-1.5 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 rounded-lg hover:bg-[#ef4444]/20 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          )}
                        {reg.status === "CONFIRMED" && onRejectRegistration && (
                          <button
                            type="button"
                            onClick={() => onRejectRegistration(reg.id)}
                            className="text-xs px-3 py-1.5 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 rounded-lg hover:bg-[#ef4444]/20 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                            title="Remove / unregister this player"
                          >
                            <XCircle className="w-3 h-3" /> Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Collapsible registration history panel with lazy loading */}
                    {isHistoryExpanded && group.history.length > 0 && (
                      <div className="ml-3 sm:ml-8 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs text-left">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-slate-700 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-slate-500" />
                            <span>
                              Registration History for{" "}
                              {reg.playerName || reg.user?.fullName}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full font-bold">
                              {group.history.length} previous record
                              {group.history.length > 1 ? "s" : ""}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleHistory(
                                group.key,
                                event.id,
                                reg.id,
                                group.history
                              )
                            }
                            className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Close
                          </button>
                        </div>

                        {loadingHistoryMap[reg.id] ? (
                          <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin text-[#f97316]" />
                            <span>Loading history records...</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {(lazyHistoryMap[reg.id] || group.history).map(
                              (hReg) => (
                                <div
                                  key={hReg.id}
                                  className="flex items-center justify-between p-2 rounded bg-white border border-slate-200/80 text-slate-600"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusBadge(
                                        hReg.status
                                      )}`}
                                    >
                                      {hReg.status}
                                    </span>
                                    <span>
                                      {hReg.registeredAt
                                        ? format(
                                            new Date(hReg.registeredAt),
                                            "MMM d, yyyy h:mm a"
                                          )
                                        : "—"}
                                    </span>
                                    {hReg.notes && (
                                      <span className="text-slate-400 italic">
                                        · {hReg.notes}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    ID #{hReg.id}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0 text-xs">
          <div className="text-slate-500 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-800">
              {filteredGroups.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-800">
              {allGrouped.length}
            </span>{" "}
            players
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
