import { useState, useEffect, useCallback } from "react";
import {
  Smartphone,
  Plus,
  SendHorizonal,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Trash2,
  ArrowDownLeft,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import {
  tripP2PService,
  type P2PDebt,
  type P2PDebtStatus,
} from "../../../services/trips/tripP2PService";
import type { Trip } from "../../../services/trips/tripService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  currentUserId: string | number;
  isOrganizer: boolean;
}

const STATUS_CONFIG: Record<
  P2PDebtStatus,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }>; strikethrough?: boolean }
> = {
  PENDING_VPA: { label: "Awaiting UPI ID", color: "bg-slate-100 text-slate-700", icon: Clock },
  COLLECT_INITIATED: { label: "Collect Sent", color: "bg-amber-100 text-amber-700", icon: SendHorizonal },
  COLLECT_APPROVED: { label: "Settled", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  COLLECT_REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-700", icon: XCircle },
  COLLECT_EXPIRED: { label: "Expired", color: "bg-slate-100 text-slate-500", icon: AlertCircle, strikethrough: true },
  CANCELLED: { label: "Cancelled", color: "bg-slate-100 text-slate-500", icon: Trash2, strikethrough: true },
};

function StatusBadge({ status }: { status: P2PDebtStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color} ${
        cfg.strikethrough ? "line-through" : ""
      }`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function AddDebtModal({
  tripId,
  onCreated,
  onClose,
}: {
  tripId: number;
  onCreated: (debt: P2PDebt) => void;
  onClose: () => void;
}) {
  const [debtorUserId, setDebtorUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = parseInt(debtorUserId, 10);
    const amt = parseFloat(amount);
    if (!uid || isNaN(amt) || amt <= 0 || !description.trim()) {
      setError("All fields required. Amount must be positive.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const debt = await tripP2PService.createDebt(tripId, {
        debtorUserId: uid,
        amount: amt,
        description: description.trim(),
      });
      onCreated(debt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create debt record";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-slate-50 space-y-3">
      <h4 className="font-bold text-slate-800 text-sm">Add Debt Record</h4>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          type="number"
          placeholder="Debtor User ID"
          value={debtorUserId}
          onChange={(e) => setDebtorUserId(e.target.value)}
          className="text-sm"
        />
        <Input
          type="number"
          step="0.01"
          min="1"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-sm"
        />
        <Input
          placeholder="Description (e.g. Hotel advance paid on behalf)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-sm"
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs">
            {saving ? "Saving..." : "Create Debt"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClose} className="text-xs">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function SendCollectModal({
  debt,
  onSent,
  onClose,
}: {
  debt: P2PDebt;
  onSent: (updated: P2PDebt) => void;
  onClose: () => void;
}) {
  const [upiVpa, setUpiVpa] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiVpa.trim()) {
      setError("UPI VPA is required");
      return;
    }
    // Basic format hint only — backend validates
    if (!upiVpa.includes("@")) {
      setError("UPI VPA should contain @ (e.g. name@upi)");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const updated = await tripP2PService.initiateCollect(debt.id, { upiVpa: upiVpa.trim() });
      setSent(true);
      onSent(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send collect request";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="p-4 border rounded-xl bg-emerald-50 text-emerald-800 text-sm text-center space-y-2">
        <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600" />
        <p className="font-semibold">Collect request sent!</p>
        <p className="text-xs text-emerald-700">The participant will receive a UPI notification to approve ₹{debt.amount.toLocaleString()}.</p>
        <Button size="sm" variant="ghost" onClick={onClose} className="text-xs text-emerald-700">Close</Button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-xl bg-indigo-50 space-y-3">
      <div>
        <h4 className="font-bold text-slate-800 text-sm">Send UPI Collect Request</h4>
        <p className="text-xs text-slate-500 mt-0.5">
          Collecting <strong>₹{debt.amount.toLocaleString()}</strong>
          {debt.debtorName ? ` from ${debt.debtorName}` : ""} · {debt.description}
        </p>
      </div>
      <form onSubmit={handleSend} className="space-y-2">
        <Input
          placeholder="UPI VPA (e.g. name@okaxis)"
          value={upiVpa}
          onChange={(e) => setUpiVpa(e.target.value)}
          className="text-sm"
        />
        <p className="text-[10px] text-slate-400">Backend validates the VPA — enter what the participant shared.</p>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={sending} className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs gap-1.5">
            <SendHorizonal className="w-3.5 h-3.5" />
            {sending ? "Sending..." : "Send Collect Request"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClose} className="text-xs">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export function TripP2PSettlementModal({ isOpen, onClose, trip, currentUserId, isOrganizer }: Props) {
  const [debts, setDebts] = useState<P2PDebt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [collectDebt, setCollectDebt] = useState<P2PDebt | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tripP2PService.listDebts(Number(trip.id));
      setDebts(data);
    } catch {
      setError("Failed to load settlement records");
    } finally {
      setLoading(false);
    }
  }, [trip.id]);

  useEffect(() => {
    if (isOpen) fetchDebts();
  }, [isOpen, fetchDebts]);

  const handleDebtCreated = (debt: P2PDebt) => {
    setDebts((prev) => [debt, ...prev]);
    setShowAddDebt(false);
  };

  const handleCollectSent = (updated: P2PDebt) => {
    setDebts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setCollectDebt(null);
  };

  const handleCancel = async (debtId: number) => {
    setCancelling(debtId);
    try {
      await tripP2PService.cancelDebt(debtId);
      setDebts((prev) =>
        prev.map((d) => (d.id === debtId ? { ...d, status: "CANCELLED" as const } : d))
      );
    } catch {
      // show nothing — optimistic cancel failed; refresh
      fetchDebts();
    } finally {
      setCancelling(null);
    }
  };

  const myUserId = Number(currentUserId);
  const outgoing = debts.filter((d) => d.creditorUserId === myUserId);
  const incoming = debts.filter((d) => d.debtorUserId === myUserId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">P2P UPI Collect — {trip.title}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Settle shared trip costs via UPI Collect requests
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue={isOrganizer ? "send" : "receive"} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-xs h-auto p-1 bg-slate-100 rounded-xl">
            {isOrganizer && (
              <TabsTrigger value="send" className="py-2 font-semibold text-xs gap-1.5">
                <SendHorizonal className="w-3.5 h-3.5 text-indigo-600" />
                Collect ({outgoing.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="receive" className="py-2 font-semibold text-xs gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-amber-600" />
              My Dues ({incoming.length})
            </TabsTrigger>
          </TabsList>

          {/* ── Organizer: Send Collect Requests ── */}
          {isOrganizer && (
            <TabsContent value="send" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Record a debt then send a UPI Collect request to the participant.
                </p>
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs gap-1.5"
                  onClick={() => setShowAddDebt(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Debt
                </Button>
              </div>

              {showAddDebt && (
                <AddDebtModal
                  tripId={Number(trip.id)}
                  onCreated={handleDebtCreated}
                  onClose={() => setShowAddDebt(false)}
                />
              )}

              {loading && <p className="text-xs text-slate-400 text-center py-4">Loading…</p>}
              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-600 p-2 bg-rose-50 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                  <Button size="sm" variant="ghost" onClick={fetchDebts} className="ml-auto text-xs gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </Button>
                </div>
              )}

              {!loading && outgoing.length === 0 && !showAddDebt && (
                <Card className="p-10 text-center border-dashed">
                  <Wallet className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-600">No outstanding debts recorded</p>
                  <p className="text-xs text-slate-400 mt-1">Add a debt to send a UPI Collect request to any participant.</p>
                </Card>
              )}

              <div className="space-y-3">
                {outgoing.map((debt) => (
                  <Card key={debt.id} className="border shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      {collectDebt?.id === debt.id ? (
                        <SendCollectModal
                          debt={debt}
                          onSent={handleCollectSent}
                          onClose={() => setCollectDebt(null)}
                        />
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-sm">
                                  ₹{debt.amount.toLocaleString()}
                                </span>
                                <StatusBadge status={debt.status} />
                              </div>
                              <p className="text-xs text-slate-500">{debt.description}</p>
                              {debt.debtorName && (
                                <p className="text-[11px] text-slate-400">From: {debt.debtorName}</p>
                              )}
                              {debt.upiVpa && (
                                <p className="text-[11px] text-slate-400 font-mono">VPA: {debt.upiVpa}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {debt.status === "PENDING_VPA" && (
                              <Button
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs gap-1.5"
                                onClick={() => setCollectDebt(debt)}
                              >
                                <SendHorizonal className="w-3.5 h-3.5" />
                                Send Collect Request
                              </Button>
                            )}
                            {debt.status === "COLLECT_REJECTED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="font-semibold text-xs gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                                onClick={() => setCollectDebt(debt)}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Retry with New VPA
                              </Button>
                            )}
                            {!["COLLECT_APPROVED", "CANCELLED"].includes(debt.status) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs text-rose-600 hover:bg-rose-50"
                                disabled={cancelling === debt.id}
                                onClick={() => handleCancel(debt.id)}
                              >
                                {cancelling === debt.id ? "Cancelling…" : "Cancel"}
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* ── Debtor: My Pending Payments ── */}
          <TabsContent value="receive" className="space-y-4 pt-4">
            <p className="text-xs text-slate-500">
              Incoming UPI Collect requests from the trip organizer. Approve via your UPI app.
            </p>

            {loading && <p className="text-xs text-slate-400 text-center py-4">Loading…</p>}
            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-600 p-2 bg-rose-50 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {!loading && incoming.length === 0 && (
              <Card className="p-10 text-center border-dashed">
                <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">No pending payments</p>
                <p className="text-xs text-slate-400 mt-1">You're all settled up for this trip!</p>
              </Card>
            )}

            <div className="space-y-3">
              {incoming.map((debt) => (
                <Card key={debt.id} className="border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">
                            ₹{debt.amount.toLocaleString()}
                          </span>
                          <StatusBadge status={debt.status} />
                        </div>
                        <p className="text-xs text-slate-500">{debt.description}</p>
                        {debt.creditorName && (
                          <p className="text-[11px] text-slate-400">From organizer: {debt.creditorName}</p>
                        )}
                      </div>
                    </div>

                    {debt.status === "COLLECT_INITIATED" && (
                      <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        <p className="font-semibold">Action required on your UPI app</p>
                        <p className="text-amber-700 mt-0.5">
                          Open your UPI app (GPay, PhonePe, Paytm) and approve the pending collect request of ₹{debt.amount.toLocaleString()}.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
