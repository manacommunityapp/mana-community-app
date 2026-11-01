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
  Sparkles,
  Receipt,
  User,
  Home,
  Phone,
  Calendar
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
import type { DashboardTournamentCard } from "../../../services/sports/sportsDashboardService";
import type { TournamentRegistration } from "../../../types/api";

interface TournamentPlayersPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: DashboardTournamentCard | null;
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

  // State for recording payment popup
  const [activePaymentPlayer, setActivePaymentPlayer] = useState<UniqueTournamentPlayer | null>(null);
  const [amount, setAmount] = useState<string>("500");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "BANK_TRANSFER" | "ONLINE" | "WAIVED">("UPI");
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    if (!isOpen || !tournament) return;

    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const events = tournament.events || [];
        const paymentsPromise = tournamentPaymentService.getPayments(tournament.id);

        // Fetch registrations for each event under this tournament
        const regPromises = events.map(async (ev) => {
          try {
            const regs = await sportsService.getTournamentRegistrations(ev.id);
            return { event: ev, registrations: regs || [] };
          } catch {
            return { event: ev, registrations: [] as TournamentRegistration[] };
          }
        });

        const [paymentsMap, eventsWithRegs] = await Promise.all([
          paymentsPromise,
          Promise.all(regPromises),
        ]);

        if (!isMounted) return;

        const deduplicated = tournamentPaymentService.deduplicatePlayers(
          eventsWithRegs,
          paymentsMap
        );
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
  }, [isOpen, tournament]);

  // Quick stats
  const stats = useMemo(() => {
    const total = players.length;
    const paid = players.filter((p) => p.paymentStatus === "PAID" || p.paymentStatus === "WAIVED").length;
    const unpaid = total - paid;
    const totalCollected = players.reduce((sum, p) => sum + (p.payment?.amount || 0), 0);
    return { total, paid, unpaid, totalCollected };
  }, [players]);

  // Filtered players
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (statusFilter === "PAID" && p.paymentStatus !== "PAID" && p.paymentStatus !== "WAIVED") {
        return false;
      }
      if (statusFilter === "UNPAID" && (p.paymentStatus === "PAID" || p.paymentStatus === "WAIVED")) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.playerName.toLowerCase().includes(q);
        const matchesFlat = p.flatNumber?.toLowerCase().includes(q);
        const matchesPhone = p.phone?.toLowerCase().includes(q);
        const matchesEvent = p.registeredEvents.some(
          (e) => e.eventName.toLowerCase().includes(q) || (e.sportName && e.sportName.toLowerCase().includes(q))
        );
        if (!matchesName && !matchesFlat && !matchesPhone && !matchesEvent) {
          return false;
        }
      }
      return true;
    });
  }, [players, searchQuery, statusFilter]);

  const handleOpenMarkPaid = (player: UniqueTournamentPlayer) => {
    setActivePaymentPlayer(player);
    setAmount("500");
    setPaymentMode("UPI");
    setTransactionRef("");
    setNotes("");
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
        adminUserId: (user as any)?.id || (user as any)?.userId,
        adminUserName: (user as any)?.fullName || (user as any)?.name || "Sports Admin",
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

      toast.success(`Payment recorded for ${activePaymentPlayer.playerName}!`);
      setActivePaymentPlayer(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (!isOpen || !tournament) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col max-h-[90vh] w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
                  {tournament.name}
                </h2>
                <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Payment Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tournament-wide participants &amp; fee collection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:px-6 bg-slate-50/70 border-b border-slate-100 text-xs">
          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 font-medium">Total Registered</span>
            <div className="text-lg font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>{stats.total} Players</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 font-medium">Paid Participants</span>
            <div className="text-lg font-black text-emerald-600 mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{stats.paid}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 font-medium">Unpaid Pending</span>
            <div className="text-lg font-black text-amber-600 mt-0.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{stats.unpaid}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 font-medium">Total Collected</span>
            <div className="text-lg font-black text-indigo-600 mt-0.5 flex items-center gap-1">
              <IndianRupee className="w-4 h-4" />
              <span>{stats.totalCollected.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3 border-b border-slate-100 bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by player, flat, sport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:inline" />
            {(["ALL", "PAID", "UNPAID"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st === "ALL" ? "All Players" : st === "PAID" ? "Paid" : "Unpaid"}
              </button>
            ))}
          </div>
        </div>

        {/* Main List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Gathering registered players across tournament events...</span>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-700">No players found</div>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your search or status filter"
                  : "No participants have registered for events in this tournament yet."}
              </p>
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const isPaid = player.paymentStatus === "PAID" || player.paymentStatus === "WAIVED";
              return (
                <div
                  key={player.playerKey}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-200 hover:shadow-2xs transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-sm">
                      {player.playerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {player.playerName}
                        </span>
                        {player.relation && (
                          <span className="rounded bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                            {player.relation}
                          </span>
                        )}
                        {player.flatNumber && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                            <Home className="w-3 h-3 text-slate-400" />
                            {player.flatNumber}
                          </span>
                        )}
                      </div>

                      {/* Events registered by this single player */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Events ({player.registeredEvents.length}):
                        </span>
                        {player.registeredEvents.map((ev, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700"
                          >
                            <span>{ev.sportName || "Sports"}</span>
                            <span className="text-slate-400">•</span>
                            <span className="truncate max-w-[130px]">{ev.eventName}</span>
                            {ev.matchType && (
                              <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1 rounded">
                                {ev.matchType.replace('_', ' ')}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Payment Audit Info (if paid) */}
                      {isPaid && player.payment && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 rounded-lg px-2.5 py-1">
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Paid ₹{player.payment.amount}</span>
                            <span>({player.payment.paymentMode})</span>
                          </span>
                          {player.payment.paidAt && (
                            <span className="text-emerald-600/80">
                              {format(new Date(player.payment.paidAt), "MMM d, yyyy h:mm a")}
                            </span>
                          )}
                          {player.payment.markedByUserName && (
                            <span className="text-slate-500">
                              Logged by: <strong className="text-slate-700">{player.payment.markedByUserName}</strong>
                            </span>
                          )}
                          {player.payment.transactionRef && (
                            <span className="text-slate-500">
                              Ref: {player.payment.transactionRef}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions / Status */}
                  <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
                    {isPaid ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs">
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                        <span>Paid</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Unpaid</span>
                        </span>
                        {canManagePayments && (
                          <button
                            type="button"
                            onClick={() => handleOpenMarkPaid(player)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Mark as Paid</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-700">{filteredPlayers.length}</strong> unique registered players
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Nested Form Modal: Record Payment & Log Audit */}
      {activePaymentPlayer && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setActivePaymentPlayer(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Mark Player as Paid</h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePaymentPlayer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
                <div className="font-bold text-indigo-900">{activePaymentPlayer.playerName}</div>
                <div className="text-indigo-700 mt-0.5">
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
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-4 py-2 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                    placeholder="500"
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none bg-white"
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Receipt Remark (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid at clubhouse desk"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* Submitting Admin Info */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>
                  Will be logged under admin: <strong className="text-slate-700">{(user as any)?.fullName || (user as any)?.name || "Sports Admin"}</strong>
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePaymentPlayer(null)}
                  disabled={submittingPayment}
                  className="flex-1 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {submittingPayment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Log Payment</span>
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
