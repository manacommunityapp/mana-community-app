import { useState, useEffect, useMemo } from "react";
import {
  X,
  Users,
  Search,
  CheckCircle2,
  Clock,
  IndianRupee,
  ShieldCheck,
  CreditCard,
  Loader2,
  Trophy,
  Filter,
  Check,
  Receipt,
  User,
  Home,
  Phone,
  Calendar,
  Crown,
  ChevronRight,
  ChevronDown,
  Building2,
  Mail,
  UserCheck,
  Pencil,
  RotateCcw,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "../../../contexts/AuthContext";
import { sportsService } from "../../../services/sports/sportsService";
import {
  tournamentPaymentService,
  type UniqueTournamentPlayer,
  type TournamentPlayerPayment
} from "../../../services/sports/tournamentPaymentService";
import {
  exportTournamentPaymentsToCSV,
  exportTournamentPaymentsToExcel,
  exportTournamentPaymentsToPDF,
} from "../../../utils/sportsExportUtils";
import type { DashboardTournamentCard } from "../../../services/sports/sportsDashboardService";
import type { TournamentRegistration } from "../../../types/api";

interface TournamentPlayersPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: DashboardTournamentCard | null;
}

export function isHeadOfHousehold(player: UniqueTournamentPlayer): boolean {
  if (player.familyMemberId) return false;
  if (!player.relation) return true;
  const rel = player.relation.trim().toUpperCase();
  return [
    "SELF",
    "PRIMARY",
    "HEAD",
    "RESIDENT",
    "OWNER",
    "TENANT",
    "PRIMARY RESIDENT",
    "HOUSEHOLD HEAD",
  ].includes(rel);
}

export function getPlayerCategory(player: UniqueTournamentPlayer): {
  isHead: boolean;
  categoryLabel: string;
  relationLabel: string;
} {
  const isHead = isHeadOfHousehold(player);
  if (isHead) {
    const isExplicitSelf = !player.relation || player.relation.trim().toUpperCase() === "SELF";
    return {
      isHead: true,
      categoryLabel: "Head of Household",
      relationLabel: isExplicitSelf ? "Primary Resident" : player.relation!,
    };
  }
  return {
    isHead: false,
    categoryLabel: "Family Member",
    relationLabel: player.relation || "Family Member",
  };
}

interface FlatGroup {
  flatNumber: string;
  heads: UniqueTournamentPlayer[];
  familyMembers: UniqueTournamentPlayer[];
  allMembers: UniqueTournamentPlayer[];
  totalEvents: number;
  paidCount: number;
  unpaidCount: number;
  allPaid: boolean;
}

export function TournamentPlayersPaymentModal({
  isOpen,
  onClose,
  tournament
}: TournamentPlayersPaymentModalProps) {
  const { user, isAdmin, isSuperAdmin, isSportsAdmin } = useAuth();
  const canManagePayments = isAdmin || isSuperAdmin || isSportsAdmin;

  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<UniqueTournamentPlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "HEAD" | "FAMILY">("ALL");
  const [viewMode, setViewMode] = useState<"FLAT" | "PLAYER">("FLAT");

  // State for popup modal showing registered events of a player
  const [viewingEventsPlayer, setViewingEventsPlayer] = useState<UniqueTournamentPlayer | null>(null);

  // State for popup modal showing payment details/audit of a paid player
  const [viewingPaymentDetailsPlayer, setViewingPaymentDetailsPlayer] = useState<UniqueTournamentPlayer | null>(null);

  // State for recording / updating payment popup
  const [activePaymentPlayer, setActivePaymentPlayer] = useState<UniqueTournamentPlayer | null>(null);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [amount, setAmount] = useState<string>("100");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "BANK_TRANSFER" | "ONLINE" | "WAIVED">("UPI");
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [markingUnpaidKey, setMarkingUnpaidKey] = useState<string | null>(null);

  const currentAdminName = (user as any)?.fullName || (user as any)?.name || "Sports Admin";
  const currentAdminPhone = (user as any)?.phone || (user as any)?.phoneNumber || "";

  // Payment Collector attribution states
  const [collectedByName, setCollectedByName] = useState<string>("");
  const [collectedByContact, setCollectedByContact] = useState<string>("");
  const [collectorSelection, setCollectorSelection] = useState<string>("SELF");

  // Parse list of coordinators from tournament
  const tournamentCoordinators = useMemo(() => {
    if (!tournament) return [];
    const list: Array<{ id: string; name: string; title: string; detail: string }> = [];

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

  const tournamentId = tournament?.id;
  const eventIdsKey = useMemo(() => {
    return (tournament?.events || []).map((e) => e.id).join(",");
  }, [tournament?.events]);

  useEffect(() => {
    if (!isOpen || !tournament || !tournamentId) return;

    let isMounted = true;

    // SWR Fast-Path: If fresh cached data exists, render it immediately in 0ms!
    const cachedPlayers = tournamentPaymentService.getCachedPlayers(tournamentId);
    if (cachedPlayers && cachedPlayers.length > 0) {
      setPlayers(cachedPlayers);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const loadData = async () => {
      try {
        const deduplicated = await tournamentPaymentService.loadTournamentPlayers(tournament, {
          forceRefresh: !cachedPlayers,
        });

        if (!isMounted) return;
        setPlayers(deduplicated);
      } catch (err) {
        console.error("Failed to load tournament players for payment:", err);
        toast.error("Failed to load registered players");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, tournamentId, eventIdsKey]);

  // Quick stats
  const stats = useMemo(() => {
    const total = players.length;
    const paid = players.filter((p) => p.paymentStatus === "PAID" || p.paymentStatus === "WAIVED").length;
    const unpaid = total - paid;
    const totalCollected = players.reduce((sum, p) => sum + (p.payment?.amount || 0), 0);
    const totalHeads = players.filter((p) => isHeadOfHousehold(p)).length;
    const totalFamily = total - totalHeads;
    const uniqueFlats = new Set(players.map((p) => (p.flatNumber || "Unassigned").trim())).size;
    return { total, paid, unpaid, totalCollected, totalHeads, totalFamily, uniqueFlats };
  }, [players]);

  // Filtered players
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      // Payment status filter
      if (statusFilter === "PAID" && p.paymentStatus !== "PAID" && p.paymentStatus !== "WAIVED") {
        return false;
      }
      if (statusFilter === "UNPAID" && (p.paymentStatus === "PAID" || p.paymentStatus === "WAIVED")) {
        return false;
      }

      // Category filter (Head vs Family)
      const isHead = isHeadOfHousehold(p);
      if (categoryFilter === "HEAD" && !isHead) {
        return false;
      }
      if (categoryFilter === "FAMILY" && isHead) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.playerName.toLowerCase().includes(q);
        const matchesFlat = p.flatNumber?.toLowerCase().includes(q);
        const matchesPhone = p.phone?.toLowerCase().includes(q);
        const matchesRelation = p.relation?.toLowerCase().includes(q);
        const matchesEvent = p.registeredEvents.some(
          (e) =>
            e.eventName.toLowerCase().includes(q) ||
            (e.sportName && e.sportName.toLowerCase().includes(q)) ||
            (e.matchType && e.matchType.toLowerCase().includes(q)) ||
            (e.partnerName && e.partnerName.toLowerCase().includes(q))
        );
        if (!matchesName && !matchesFlat && !matchesPhone && !matchesRelation && !matchesEvent) {
          return false;
        }
      }
      return true;
    });
  }, [players, searchQuery, statusFilter, categoryFilter]);

  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const handleExport = (
    exportFormat: "excel" | "csv-roster" | "csv-events" | "pdf",
    scope: "current" | "all" = "current"
  ) => {
    const targetPlayers = scope === "all" ? players : filteredPlayers;
    if (targetPlayers.length === 0) {
      toast.error("No players available to export");
      return;
    }
    const tName = tournament?.name || "Tournament";
    setExportDropdownOpen(false);

    const exportStats = {
      total: targetPlayers.length,
      flats: new Set(targetPlayers.map((p) => p.flatNumber).filter(Boolean)).size,
      paid: targetPlayers.filter((p) => p.paymentStatus === "PAID" || p.paymentStatus === "WAIVED").length,
      unpaid: targetPlayers.filter((p) => p.paymentStatus !== "PAID" && p.paymentStatus !== "WAIVED").length,
      totalCollected: targetPlayers.reduce((sum, p) => sum + (p.payment?.amount || 0), 0),
    };

    try {
      if (exportFormat === "excel") {
        exportTournamentPaymentsToExcel(targetPlayers, tName, exportStats);
        toast.success(`Exported ${targetPlayers.length} participants to Excel`);
      } else if (exportFormat === "csv-roster") {
        exportTournamentPaymentsToCSV(targetPlayers, tName, "roster");
        toast.success(`Exported ${targetPlayers.length} participant roster rows to CSV`);
      } else if (exportFormat === "csv-events") {
        exportTournamentPaymentsToCSV(targetPlayers, tName, "events");
        toast.success(`Exported detailed event registrations to CSV`);
      } else if (exportFormat === "pdf") {
        exportTournamentPaymentsToPDF(targetPlayers, tName, exportStats);
      }
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export player details");
    }
  };

  // Group by Flat Number Category
  const flatGroups = useMemo<FlatGroup[]>(() => {
    const map = new Map<string, UniqueTournamentPlayer[]>();

    for (const player of filteredPlayers) {
      const flat = (player.flatNumber || "Unassigned").trim();
      if (!map.has(flat)) {
        map.set(flat, []);
      }
      map.get(flat)!.push(player);
    }

    const groups: FlatGroup[] = [];

    for (const [flatNumber, members] of map.entries()) {
      let heads = members.filter((m) => isHeadOfHousehold(m));
      let familyMembers = members.filter((m) => !isHeadOfHousehold(m));

      // If flat has members but none were flagged as head, designate first member as head
      if (heads.length === 0 && members.length > 0) {
        const headIdx = members.findIndex((m) => m.userId && !m.familyMemberId);
        const chosenIdx = headIdx >= 0 ? headIdx : 0;
        heads = [members[chosenIdx]];
        familyMembers = members.filter((_, idx) => idx !== chosenIdx);
      }

      const totalEvents = members.reduce((sum, m) => sum + m.registeredEvents.length, 0);
      const paidCount = members.filter(
        (m) => m.paymentStatus === "PAID" || m.paymentStatus === "WAIVED"
      ).length;
      const unpaidCount = members.length - paidCount;
      const allPaid = members.length > 0 && unpaidCount === 0;

      // Ordered members: heads first, then family members
      const sortedMembers = [...heads, ...familyMembers];

      groups.push({
        flatNumber,
        heads,
        familyMembers,
        allMembers: sortedMembers,
        totalEvents,
        paidCount,
        unpaidCount,
        allPaid,
      });
    }

    return groups.sort((a, b) => {
      if (a.flatNumber === "Unassigned") return 1;
      if (b.flatNumber === "Unassigned") return -1;
      return a.flatNumber.localeCompare(b.flatNumber, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [filteredPlayers]);

  const handleOpenMarkPaid = (player: UniqueTournamentPlayer) => {
    setActivePaymentPlayer(player);
    setIsEditingPayment(false);
    setAmount("100");
    setPaymentMode("UPI");
    setTransactionRef("");
    setNotes("");
    setCollectorSelection("SELF");
    setCollectedByName(currentAdminName);
    setCollectedByContact(currentAdminPhone);
  };

  const handleOpenEditPayment = (player: UniqueTournamentPlayer) => {
    setActivePaymentPlayer(player);
    setIsEditingPayment(true);
    setAmount(player.payment?.amount != null ? String(player.payment.amount) : "100");
    setPaymentMode((player.payment?.paymentMode as any) || "UPI");
    setTransactionRef(player.payment?.transactionRef || "");
    setNotes(player.payment?.notes || "");

    const existingName = player.payment?.collectedByName;
    const existingContact = player.payment?.collectedByContact || "";
    if (existingName) {
      setCollectedByName(existingName);
      setCollectedByContact(existingContact);
      const matched = tournamentCoordinators.find(
        (c) => c.name.toLowerCase() === existingName.toLowerCase()
      );
      if (matched) {
        setCollectorSelection(matched.id);
      } else if (existingName.toLowerCase() === currentAdminName.toLowerCase()) {
        setCollectorSelection("SELF");
      } else {
        setCollectorSelection("OTHER");
      }
    } else {
      setCollectorSelection("SELF");
      setCollectedByName(currentAdminName);
      setCollectedByContact(currentAdminPhone);
    }
  };

  const handleMarkUnpaid = async (player: UniqueTournamentPlayer) => {
    if (!tournament) return;
    const confirmed = window.confirm(
      `Are you sure you want to mark ${player.playerName} as Unpaid? This will revert their payment record.`
    );
    if (!confirmed) return;

    setMarkingUnpaidKey(player.playerKey);
    try {
      await tournamentPaymentService.markUnpaid(tournament.id, player.playerKey);

      // Update state locally
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.playerKey === player.playerKey) {
            return {
              ...p,
              payment: undefined,
              paymentStatus: "UNPAID",
            };
          }
          return p;
        })
      );

      // If viewing payment details player was open, close it
      if (viewingPaymentDetailsPlayer?.playerKey === player.playerKey) {
        setViewingPaymentDetailsPlayer(null);
      }

      // If viewing events player was open, update it
      if (viewingEventsPlayer?.playerKey === player.playerKey) {
        setViewingEventsPlayer((prev) =>
          prev
            ? {
                ...prev,
                payment: undefined,
                paymentStatus: "UNPAID",
              }
            : null
        );
      }

      toast.success(`${player.playerName} marked as Unpaid`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark player as unpaid");
    } finally {
      setMarkingUnpaidKey(null);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament || !activePaymentPlayer) return;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSubmittingPayment(true);
    try {
      const saved = await tournamentPaymentService.recordPayment(tournament.id, {
        playerKey: activePaymentPlayer.playerKey,
        userId: activePaymentPlayer.userId,
        familyMemberId: activePaymentPlayer.familyMemberId,
        playerName: activePaymentPlayer.playerName,
        flatNumber: activePaymentPlayer.flatNumber,
        phone: activePaymentPlayer.phone,
        email: activePaymentPlayer.email,
        amount: numAmount,
        paymentMode,
        transactionRef: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
        collectedByName: collectedByName.trim() || undefined,
        collectedByContact: collectedByContact.trim() || undefined,
        adminUserId: (user as any)?.id || (user as any)?.userId,
        adminUserName: currentAdminName,
      });

      // Update state locally
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.playerKey === activePaymentPlayer.playerKey) {
            return {
              ...p,
              payment: saved,
              paymentStatus: saved.paymentStatus,
            };
          }
          return p;
        })
      );

      // Also update viewingEventsPlayer if currently open
      if (viewingEventsPlayer && viewingEventsPlayer.playerKey === activePaymentPlayer.playerKey) {
        setViewingEventsPlayer((prev) =>
          prev
            ? {
                ...prev,
                payment: saved,
                paymentStatus: saved.paymentStatus,
              }
            : null
        );
      }

      // Also update viewingPaymentDetailsPlayer if currently open
      if (viewingPaymentDetailsPlayer && viewingPaymentDetailsPlayer.playerKey === activePaymentPlayer.playerKey) {
        setViewingPaymentDetailsPlayer((prev) =>
          prev
            ? {
                ...prev,
                payment: saved,
                paymentStatus: saved.paymentStatus,
              }
            : null
        );
      }

      toast.success(
        isEditingPayment
          ? `Payment updated for ${activePaymentPlayer.playerName}!`
          : `Payment recorded for ${activePaymentPlayer.playerName}!`
      );
      setActivePaymentPlayer(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (!isOpen || !tournament) return null;

  // Single-row player card matching application design and compact typography
  const renderPlayerCard = (player: UniqueTournamentPlayer, isUnderFlatView = false) => {
    const isPaid = player.paymentStatus === "PAID" || player.paymentStatus === "WAIVED";
    const categoryInfo = getPlayerCategory(player);

    return (
      <div
        key={player.playerKey}
        className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border transition-all ${
          isUnderFlatView
            ? categoryInfo.isHead
              ? "border-indigo-100 bg-indigo-50/25 hover:border-indigo-300"
              : "border-purple-100 bg-purple-50/20 hover:border-purple-300"
            : "border-slate-200/90 bg-white hover:border-indigo-200 hover:shadow-2xs"
        }`}
      >
        {/* Single Row: Avatar, Name, Category Badge, Flat (if needed), Registered Events, Phone */}
        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold text-xs shadow-2xs ${
              categoryInfo.isHead
                ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200"
                : "bg-purple-100 text-purple-700 ring-1 ring-purple-200"
            }`}
          >
            {player.playerName.charAt(0).toUpperCase()}
          </div>

          {/* Participant Name */}
          <span className="text-xs font-bold text-slate-900 truncate max-w-[160px] sm:max-w-none">
            {player.playerName}
          </span>

          {/* Head vs Family Category Badge */}
          {categoryInfo.isHead ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 shrink-0">
              <Crown className="w-2.5 h-2.5 text-indigo-600" />
              <span>Head ({categoryInfo.relationLabel})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 shrink-0">
              <Users className="w-2.5 h-2.5 text-purple-600" />
              <span>Family ({categoryInfo.relationLabel})</span>
            </span>
          )}

          {/* Doubles Partner Badge if participating solely as invited partner */}
          {player.isPartnerOnly && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
              <Users className="w-2.5 h-2.5 text-emerald-600" />
              <span>Doubles Partner</span>
            </span>
          )}

          {/* Flat Number (shown in All Players view) */}
          {!isUnderFlatView && player.flatNumber && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 shrink-0">
              <Home className="w-3 h-3 text-slate-400" />
              <span>{player.flatNumber}</span>
            </span>
          )}

          {/* Registered Events Button */}
          <button
            type="button"
            onClick={() => setViewingEventsPlayer(player)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs group shrink-0 active:scale-[0.98]"
          >
            <Trophy className="w-3 h-3 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span>Registered Events ({player.registeredEvents.length})</span>
            <ChevronRight className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {player.phone && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 shrink-0 hidden md:inline-flex">
              <Phone className="w-2.5 h-2.5" />
              <span>{player.phone}</span>
            </span>
          )}
        </div>

        {/* Right Action: Just Paid (Receipt Button), Update Amount, or Make Unpaid */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {isPaid ? (
            <>
              <button
                type="button"
                onClick={() => player.payment && setViewingPaymentDetailsPlayer(player)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs transition-all cursor-pointer group"
                title="Click to view payment receipt & audit log"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span>Paid ₹{player.payment?.amount ?? 0}</span>
                <Receipt className="w-3 h-3 text-emerald-500 group-hover:text-emerald-700 transition-colors ml-0.5" />
              </button>

              {player.payment?.collectedByName &&
                player.payment.collectedByName.toLowerCase() !== (player.payment.markedByUserName || "").toLowerCase() && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md hidden sm:inline-flex"
                    title={`Collected on behalf of admin by: ${player.payment.collectedByName}${player.payment.collectedByContact ? ` (${player.payment.collectedByContact})` : ""}`}
                  >
                    <UserCheck className="w-2.5 h-2.5 text-indigo-600" />
                    <span className="truncate max-w-[130px]">Via: {player.payment.collectedByName}</span>
                  </span>
                )}

              {canManagePayments && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenEditPayment(player)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-[0.98] group"
                    title="Update paid amount or payment details"
                  >
                    <Pencil className="w-3 h-3 text-slate-500 group-hover:text-indigo-600" />
                    <span>Update Amount</span>
                  </button>

                  <button
                    type="button"
                    disabled={markingUnpaidKey === player.playerKey}
                    onClick={() => handleMarkUnpaid(player)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
                    title="Mark this player as unpaid / revert payment"
                  >
                    {markingUnpaidKey === player.playerKey ? (
                      <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                    ) : (
                      <RotateCcw className="w-3 h-3 text-rose-600" />
                    )}
                    <span>Make Unpaid</span>
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                <Clock className="w-3 h-3" />
                <span>Unpaid</span>
              </span>
              {canManagePayments && (
                <button
                  type="button"
                  onClick={() => handleOpenMarkPaid(player)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Mark as Paid</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col max-h-[92vh] w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                  {tournament.name}
                </h2>
                <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  Payment Hub
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tournament participant fee collection &amp; flat-family hierarchy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport("excel")}
              disabled={players.length === 0}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-indigo-50/70 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/exp"
              title="Quick download all tournament participant & payment details as Excel (.xls)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600 group-hover/exp:scale-110 transition-transform" />
              <span>Export All Details</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Compact Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 sm:px-5 bg-slate-50/70 border-b border-slate-100 text-xs">
          <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium">Total Registered</span>
            <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>{stats.total} Players</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium">Flats Registered</span>
            <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-blue-500" />
              <span>{stats.uniqueFlats} Flats</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium">Paid Participants</span>
            <div className="text-sm sm:text-base font-black text-emerald-600 mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats.paid}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium">Unpaid Pending</span>
            <div className="text-sm sm:text-base font-black text-amber-600 mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{stats.unpaid}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-500 font-medium">Total Collected</span>
            <div className="text-sm sm:text-base font-black text-indigo-600 mt-0.5 flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>{stats.totalCollected.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Search, View Switcher & Filter Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 px-5 py-2.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search player, flat (e.g. A-101), sport..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("FLAT")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === "FLAT"
                    ? "bg-white text-indigo-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>By Flat &amp; Family</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("PLAYER")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === "PLAYER"
                    ? "bg-white text-indigo-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <User className="w-3 h-3" />
                <span>All Players</span>
              </button>
            </div>

            {/* Category Filter */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80 text-xs">
              {(
                [
                  { id: "ALL", label: "All" },
                  { id: "HEAD", label: "👑 Heads" },
                  { id: "FAMILY", label: "👨‍👩‍👧 Family" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    categoryFilter === cat.id
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Payment Status Filter */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80 text-xs">
              {(["ALL", "PAID", "UNPAID"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                    statusFilter === st
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st === "ALL" ? "All Status" : st === "PAID" ? "Paid" : "Unpaid"}
                </button>
              ))}
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                disabled={players.length === 0}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                  players.length > 0
                    ? "bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer"
                    : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                }`}
                title="Download tournament participant roster & payment records"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Export</span>
                {filteredPlayers.length < players.length && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.2 rounded-full">
                    {filteredPlayers.length}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {exportDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setExportDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-left text-xs divide-y divide-slate-100">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Export Details ({filteredPlayers.length} {filteredPlayers.length === 1 ? "player" : "players"})
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => handleExport("excel")}
                        className="w-full px-3 py-2 text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-700 flex items-start gap-2.5 cursor-pointer transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">Download Excel (.xls)</div>
                          <div className="text-[10px] text-slate-400">Complete roster, events &amp; payment ledger</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport("csv-roster")}
                        className="w-full px-3 py-2 text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-700 flex items-start gap-2.5 cursor-pointer transition-colors"
                      >
                        <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">Download CSV — Player Summary</div>
                          <div className="text-[10px] text-slate-400">1 row per participant with all payment info</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport("csv-events")}
                        className="w-full px-3 py-2 text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-700 flex items-start gap-2.5 cursor-pointer transition-colors"
                      >
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">Download CSV — Event Breakdown</div>
                          <div className="text-[10px] text-slate-400">1 row per event registration &amp; partner</div>
                        </div>
                      </button>
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => handleExport("pdf")}
                        className="w-full px-3 py-2 text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-700 flex items-start gap-2.5 cursor-pointer transition-colors"
                      >
                        <Printer className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">Print / Save PDF Roster</div>
                          <div className="text-[10px] text-slate-400">Printable sheet with summary stats</div>
                        </div>
                      </button>
                    </div>
                    {filteredPlayers.length < players.length && (
                      <div className="p-1.5 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => handleExport("excel", "all")}
                          className="w-full px-2 py-1.5 text-center text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                        >
                          Export All {players.length} Players (Ignore Filters)
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>


        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Gathering registered players across tournament events...</span>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-700">No players found</div>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                {searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL"
                  ? "Try adjusting your search or filters"
                  : "No participants have registered for events in this tournament yet."}
              </p>
            </div>
          ) : viewMode === "FLAT" ? (
            /* By Flat & Family Category View */
            <div className="space-y-2.5">
              {flatGroups.map((group) => (
                <div
                  key={group.flatNumber}
                  className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden"
                >
                  {/* Flat Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2 bg-gradient-to-r from-slate-50 via-slate-50/70 to-white border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold">
                        <Home className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-bold text-slate-900">
                          Flat {group.flatNumber}
                        </h3>
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-semibold text-slate-600">
                          {group.allMembers.length} {group.allMembers.length === 1 ? "Member" : "Members"}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-semibold text-indigo-700">
                          {group.totalEvents} {group.totalEvents === 1 ? "Event" : "Events"}
                        </span>
                      </div>
                    </div>

                    {/* Flat Payment Status Badge */}
                    <div className="flex items-center gap-2">
                      {group.allPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          <span>Flat Fully Paid ({group.paidCount}/{group.allMembers.length})</span>
                        </span>
                      ) : group.paidCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Partial ({group.paidCount}/{group.allMembers.length} Paid)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Flat Unpaid (0/{group.allMembers.length})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Flat Body: Members directly rendered without bulky section headers */}
                  <div className="p-2 sm:p-2.5 space-y-1.5">
                    {group.allMembers.map((player) => renderPlayerCard(player, true))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Flat Linear All Players View */
            <div className="space-y-1.5">
              {filteredPlayers.map((player) => renderPlayerCard(player, false))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] text-slate-500">
            Showing <strong className="text-slate-700">{filteredPlayers.length}</strong> unique registered players across <strong className="text-slate-700">{flatGroups.length}</strong> flats
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* POPUP MODAL: Registered Events of Selected Player */}
      {viewingEventsPlayer && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150"
          onClick={() => setViewingEventsPlayer(null)}
        >
          <div
            className="relative flex flex-col max-h-[85vh] w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 via-white to-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Registered Events
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enrolled tournament activities &amp; participant formats
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingEventsPlayer(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Participant Banner */}
            <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs">
                  {viewingEventsPlayer.playerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">
                      {viewingEventsPlayer.playerName}
                    </span>
                    {(() => {
                      const cat = getPlayerCategory(viewingEventsPlayer);
                      return cat.isHead ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[9px] font-bold text-indigo-700">
                          <Crown className="w-2.5 h-2.5 text-indigo-600" />
                          <span>Head ({cat.relationLabel})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-[9px] font-bold text-purple-700">
                          <Users className="w-2.5 h-2.5 text-purple-600" />
                          <span>Family ({cat.relationLabel})</span>
                        </span>
                      );
                    })()}
                    {viewingEventsPlayer.isPartnerOnly && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-700">
                        <Users className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Doubles Partner</span>
                      </span>
                    )}
                    {viewingEventsPlayer.flatNumber && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                        <Home className="w-2.5 h-2.5 text-slate-400" />
                        <span>Flat {viewingEventsPlayer.flatNumber}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Enrolled in <strong className="text-slate-700">{viewingEventsPlayer.registeredEvents.length}</strong> event(s) in this tournament
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {viewingEventsPlayer.paymentStatus === "PAID" || viewingEventsPlayer.paymentStatus === "WAIVED" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const p = viewingEventsPlayer;
                        setViewingPaymentDetailsPlayer(p);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs cursor-pointer transition-colors"
                      title="Click to view payment receipt & audit log"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span>Paid ₹{viewingEventsPlayer.payment?.amount ?? 0}</span>
                      <Receipt className="w-3 h-3 text-emerald-500 ml-0.5" />
                    </button>
                    {canManagePayments && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditPayment(viewingEventsPlayer)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold cursor-pointer transition-colors"
                          title="Update payment amount or transaction details"
                        >
                          <Pencil className="w-3 h-3 text-indigo-600" />
                          <span>Update</span>
                        </button>
                        <button
                          type="button"
                          disabled={markingUnpaidKey === viewingEventsPlayer.playerKey}
                          onClick={() => handleMarkUnpaid(viewingEventsPlayer)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                          title="Mark this player as unpaid / revert payment"
                        >
                          {markingUnpaidKey === viewingEventsPlayer.playerKey ? (
                            <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                          ) : (
                            <RotateCcw className="w-3 h-3 text-rose-600" />
                          )}
                          <span>Make Unpaid</span>
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Tournament Fee Unpaid</span>
                  </span>
                )}
              </div>
            </div>

            {/* Events List Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
              {viewingEventsPlayer.registeredEvents.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-2xs transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {ev.sportName || "Sports"}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">
                          {ev.eventName}
                        </h4>
                        {ev.matchType && (
                          <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[9px] font-black uppercase text-indigo-700">
                            {ev.matchType.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ev.status === "CONFIRMED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : ev.status === "REGISTERED"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    {ev.registeredAt && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>
                          Registered:{" "}
                          <strong className="text-slate-700 font-medium">
                            {format(new Date(ev.registeredAt), "MMM d, yyyy • h:mm a")}
                          </strong>
                        </span>
                      </span>
                    )}
                    {ev.partnerName && (
                      <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                        <Users className="w-3 h-3 text-indigo-600" />
                        <span>
                          {ev.isPartner ? "Playing with:" : "Partner:"} <strong className="font-semibold">{ev.partnerName}</strong>
                          {ev.partnerPhone ? ` (${ev.partnerPhone})` : ""}
                          {ev.isPartner ? " (Confirmed Partner)" : ""}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 bg-slate-50/60">
              <div className="text-[11px] text-slate-500">
                Total <strong>{viewingEventsPlayer.registeredEvents.length}</strong> event(s)
              </div>
              <div className="flex items-center gap-2">
                {canManagePayments && (
                  viewingEventsPlayer.paymentStatus === "PAID" || viewingEventsPlayer.paymentStatus === "WAIVED" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const p = viewingEventsPlayer;
                          handleOpenEditPayment(p);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                        title="Update payment amount or details"
                      >
                        <Pencil className="w-3 h-3 text-indigo-600" />
                        <span>Update Amount</span>
                      </button>
                      <button
                        type="button"
                        disabled={markingUnpaidKey === viewingEventsPlayer.playerKey}
                        onClick={() => handleMarkUnpaid(viewingEventsPlayer)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                        title="Mark this player as unpaid / revert payment"
                      >
                        {markingUnpaidKey === viewingEventsPlayer.playerKey ? (
                          <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                        ) : (
                          <RotateCcw className="w-3 h-3 text-rose-600" />
                        )}
                        <span>Make Unpaid</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const p = viewingEventsPlayer;
                        setViewingEventsPlayer(null);
                        handleOpenMarkPaid(p);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Mark as Paid</span>
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setViewingEventsPlayer(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Payment Audit & Receipt Details */}
      {viewingPaymentDetailsPlayer && viewingPaymentDetailsPlayer.payment && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150"
          onClick={() => setViewingPaymentDetailsPlayer(null)}
        >
          <div
            className="relative flex flex-col max-h-[88vh] w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 via-white to-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Payment Receipt &amp; Audit
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Official tournament fee registration log
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingPaymentDetailsPlayer(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
              {/* Highlight Card */}
              <div className="text-center p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/90 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Tournament Fee Paid
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-0.5 flex items-center justify-center gap-1">
                  <IndianRupee className="w-5 h-5" />
                  <span>{viewingPaymentDetailsPlayer.payment.amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-emerald-200 text-[11px] font-bold text-emerald-800 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Mode: {viewingPaymentDetailsPlayer.payment.paymentMode}</span>
                </div>
              </div>

              {/* Key Details Rows */}
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-slate-50/50">
                  <span className="text-slate-500">Participant</span>
                  <span className="font-bold text-slate-900">{viewingPaymentDetailsPlayer.playerName}</span>
                </div>

                {viewingPaymentDetailsPlayer.flatNumber && (
                  <div className="flex justify-between items-center p-2.5">
                    <span className="text-slate-500">Flat Number</span>
                    <span className="font-bold text-slate-900">Flat {viewingPaymentDetailsPlayer.flatNumber}</span>
                  </div>
                )}

                <div className="flex justify-between items-center p-2.5 bg-slate-50/50">
                  <span className="text-slate-500">Category</span>
                  <span className="font-semibold text-slate-800">
                    {getPlayerCategory(viewingPaymentDetailsPlayer).categoryLabel}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5">
                  <span className="text-slate-500">Tournament</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">
                    {tournament.name}
                  </span>
                </div>

                {viewingPaymentDetailsPlayer.payment.paidAt && (
                  <div className="flex justify-between items-center p-2.5 bg-slate-50/50">
                    <span className="text-slate-500">Payment Date &amp; Time</span>
                    <span className="font-bold text-slate-900">
                      {format(new Date(viewingPaymentDetailsPlayer.payment.paidAt), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                )}

                {viewingPaymentDetailsPlayer.payment.collectedByName && (
                  <div className="flex justify-between items-center p-2.5 bg-indigo-50/40">
                    <div>
                      <span className="text-slate-600 font-medium block">Payment Collected By</span>
                      <span className="text-[10px] text-slate-400">On behalf of Tournament Committee</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-900 block">
                        {viewingPaymentDetailsPlayer.payment.collectedByName}
                      </span>
                      {viewingPaymentDetailsPlayer.payment.collectedByContact && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {viewingPaymentDetailsPlayer.payment.collectedByContact}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {viewingPaymentDetailsPlayer.payment.markedByUserName && (
                  <div className="flex justify-between items-center p-2.5">
                    <span className="text-slate-500">Logged By Admin</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                      {viewingPaymentDetailsPlayer.payment.markedByUserName}
                    </span>
                  </div>
                )}

                {viewingPaymentDetailsPlayer.payment.transactionRef && (
                  <div className="flex justify-between items-center p-2.5 bg-slate-50/50">
                    <span className="text-slate-500">Transaction / UTR Ref</span>
                    <span className="font-mono text-[11px] font-bold text-slate-800">
                      {viewingPaymentDetailsPlayer.payment.transactionRef}
                    </span>
                  </div>
                )}

                {viewingPaymentDetailsPlayer.payment.notes && (
                  <div className="p-2.5">
                    <span className="text-slate-500 block mb-1">Admin Remark / Notes</span>
                    <p className="text-slate-800 font-medium italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{viewingPaymentDetailsPlayer.payment.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 bg-slate-50/60">
              {canManagePayments ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const p = viewingPaymentDetailsPlayer;
                      setViewingPaymentDetailsPlayer(null);
                      handleOpenEditPayment(p);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                    title="Update payment amount or transaction details"
                  >
                    <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Update Amount</span>
                  </button>
                  <button
                    type="button"
                    disabled={markingUnpaidKey === viewingPaymentDetailsPlayer.playerKey}
                    onClick={() => handleMarkUnpaid(viewingPaymentDetailsPlayer)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                    title="Mark this player as unpaid / revert payment"
                  >
                    {markingUnpaidKey === viewingPaymentDetailsPlayer.playerKey ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>Make Unpaid</span>
                  </button>
                </div>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setViewingPaymentDetailsPlayer(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nested Form Modal: Record Payment & Log Audit */}
      {activePaymentPlayer && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setActivePaymentPlayer(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {isEditingPayment ? "Update Payment Amount & Details" : "Mark Player as Paid"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePaymentPlayer(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="mt-3.5 space-y-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
                <div className="font-bold text-indigo-900">{activePaymentPlayer.playerName}</div>
                <div className="text-indigo-700 mt-0.5 text-[11px]">
                  {activePaymentPlayer.flatNumber ? `Flat: ${activePaymentPlayer.flatNumber} • ` : ""}
                  Registered for {activePaymentPlayer.registeredEvents.length} event(s) in this tournament
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount Received (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-8 pr-3 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                    placeholder="100"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none bg-white"
                >
                  <option value="UPI">UPI / QR Code / GPay / PhonePe</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer / NEFT / IMPS</option>
                  <option value="ONLINE">Online Portal</option>
                  <option value="WAIVED">Waived / Free Entry / Sponsor</option>
                </select>
              </div>

              {/* Reference ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transaction Reference / UTR (Optional)
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI Ref #439281982312"
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Remark (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid at clubhouse desk"
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* Payment Collected On Behalf Of Admin By */}
              <div className="space-y-2 p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Payment Collected By
                  </label>
                  <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-100/70 px-1.5 py-0.2 rounded">
                    On behalf of Admin
                  </span>
                </div>
                <select
                  value={collectorSelection}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCollectorSelection(val);
                    if (val === "SELF") {
                      setCollectedByName(currentAdminName);
                      setCollectedByContact(currentAdminPhone);
                    } else if (val === "OTHER") {
                      setCollectedByName("");
                      setCollectedByContact("");
                    } else {
                      const coord = tournamentCoordinators.find((c) => c.id === val);
                      if (coord) {
                        setCollectedByName(coord.name);
                        setCollectedByContact(coord.detail || coord.title);
                      }
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none bg-white"
                >
                  <option value="SELF">Myself ({currentAdminName})</option>
                  {tournamentCoordinators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.title}{c.detail ? ` • ${c.detail}` : ""})
                    </option>
                  ))}
                  <option value="OTHER">Other Volunteer / Block Lead (Enter details)</option>
                </select>

                {collectorSelection === "OTHER" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150">
                    <div>
                      <input
                        type="text"
                        required
                        value={collectedByName}
                        onChange={(e) => setCollectedByName(e.target.value)}
                        placeholder="Collector Name (e.g. Ramesh)"
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 bg-white placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={collectedByContact}
                        onChange={(e) => setCollectedByContact(e.target.value)}
                        placeholder="Contact / Flat (e.g. Flat 301, 9876543210)"
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 bg-white placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submitting Admin Info */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>
                  Logged in system by: <strong className="text-slate-700">{currentAdminName}</strong>
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => setActivePaymentPlayer(null)}
                  disabled={submittingPayment}
                  className="flex-1 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {submittingPayment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isEditingPayment ? "Update Payment" : "Confirm & Log Payment"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
