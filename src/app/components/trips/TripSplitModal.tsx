import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  PieChart,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Wallet,
  Clock,
  Layers,
  Settings,
  AlertCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import {
  tripSplitService,
  type ExpenseView,
  type DashboardView,
  type TransferView,
  type PaymentView,
  type SummaryView,
  type SplitMethod,
  type MyMoneyMode,
} from "../../../services/trips/tripSplitService";
import type { Trip } from "../../../services/trips/tripService";

interface TripSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  currentUserId: string | number;
  isOrganizer: boolean;
}

const CATEGORIES = [
  { code: "ACCOMMODATION", label: "Hotel & Stay" },
  { code: "TRANSPORT", label: "Bus & Flight" },
  { code: "FUEL", label: "Fuel & Gas" },
  { code: "FOOD", label: "Food & Dining" },
  { code: "ACTIVITIES", label: "Activities & Sports" },
  { code: "TICKETS", label: "Entry Tickets" },
  { code: "SHOPPING", label: "Shopping" },
  { code: "PARKING", label: "Parking" },
  { code: "TOLL", label: "Highway Toll" },
  { code: "MISCELLANEOUS", label: "Miscellaneous" },
];

export function TripSplitModal({
  isOpen,
  onClose,
  trip,
  currentUserId,
  isOrganizer,
}: TripSplitModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [dashboard, setDashboard] = useState<DashboardView | null>(null);
  const [expenses, setExpenses] = useState<ExpenseView[]>([]);
  const [settlements, setSettlements] = useState<TransferView[]>([]);
  const [payments, setPayments] = useState<PaymentView[]>([]);
  const [summary, setSummary] = useState<SummaryView | null>(null);
  const [myMoneyMode, setMyMoneyMode] = useState<MyMoneyMode>("OFF");
  const [updatingPref, setUpdatingPref] = useState(false);

  // Sub-dialogs
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false);

  // Form states: New Expense
  const [newCategory, setNewCategory] = useState("FOOD");
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newSplitMethod, setNewSplitMethod] = useState<SplitMethod | "">("EQUAL");
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Form states: Record Payment
  const [payToUserId, setPayToUserId] = useState<number | "">("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("UPI");
  const [payRef, setPayRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Form states: Budget
  const [budgetEstimate, setBudgetEstimate] = useState("");
  const [submittingBudget, setSubmittingBudget] = useState(false);

  const loadData = useCallback(async () => {
    if (!trip?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [dash, exps, stl, pms, smy, pref] = await Promise.all([
        tripSplitService.getBudget(trip.id).catch(() => null),
        tripSplitService.getExpenses(trip.id).catch(() => []),
        tripSplitService.getSettlements(trip.id).catch(() => []),
        tripSplitService.getPayments(trip.id).catch(() => []),
        tripSplitService.getSummary(trip.id).catch(() => null),
        tripSplitService.getMyMoneyPrefs(trip.id).catch(() => ({ mode: "OFF" as MyMoneyMode })),
      ]);
      setDashboard(dash);
      setExpenses(exps);
      setSettlements(stl);
      setPayments(pms);
      setSummary(smy);
      if (pref?.mode) setMyMoneyMode(pref.mode);
    } catch (err: any) {
      setError(err?.message || "Failed to load Trip Split details");
    } finally {
      setLoading(false);
    }
  }, [trip?.id]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleUpdatePreference = async (mode: MyMoneyMode) => {
    setUpdatingPref(true);
    try {
      const updated = await tripSplitService.setMyMoneyPrefs(trip.id, mode);
      setMyMoneyMode(updated.mode);
    } catch (err: any) {
      alert("Failed to update preference: " + (err?.message || "Unknown error"));
    } finally {
      setUpdatingPref(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (!newDescription.trim()) {
      alert("Please provide a description");
      return;
    }

    setSubmittingExpense(true);
    try {
      await tripSplitService.createExpense(trip.id, {
        categoryCode: newCategory,
        description: newDescription.trim(),
        totalAmount: amt,
        splitMethod: newSplitMethod || undefined,
      });
      setIsAddExpenseOpen(false);
      setNewDescription("");
      setNewAmount("");
      loadData();
    } catch (err: any) {
      alert("Error adding expense: " + (err?.message || "Check participants"));
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleVoidExpense = async (expenseId: number) => {
    if (!confirm("Are you sure you want to void this expense?")) return;
    try {
      await tripSplitService.voidExpense(trip.id, expenseId);
      loadData();
    } catch (err: any) {
      alert("Failed to void expense: " + (err?.message || "Unauthorized"));
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!payToUserId || isNaN(amt) || amt <= 0) {
      alert("Please select recipient and valid amount");
      return;
    }

    setSubmittingPayment(true);
    try {
      await tripSplitService.recordPayment(trip.id, {
        toUserId: Number(payToUserId),
        amount: amt,
        method: payMethod,
        reference: payRef.trim() || undefined,
      });
      setIsRecordPaymentOpen(false);
      setPayAmount("");
      setPayRef("");
      loadData();
    } catch (err: any) {
      alert("Failed to record payment: " + (err?.message || "Invalid payment"));
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleConfirmPayment = async (id: number) => {
    try {
      await tripSplitService.confirmPayment(trip.id, id);
      loadData();
    } catch (err: any) {
      alert("Failed to confirm payment: " + (err?.message || "Unauthorized"));
    }
  };

  const handleRejectPayment = async (id: number) => {
    try {
      await tripSplitService.rejectPayment(trip.id, id);
      loadData();
    } catch (err: any) {
      alert("Failed to reject payment: " + (err?.message || "Unauthorized"));
    }
  };

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const est = parseFloat(budgetEstimate);
    if (isNaN(est) || est < 0) {
      alert("Please enter a valid budget amount");
      return;
    }
    setSubmittingBudget(true);
    try {
      await tripSplitService.setBudget(trip.id, {
        estimatedAmount: est,
        currency: "INR",
      });
      setIsSetBudgetOpen(false);
      loadData();
    } catch (err: any) {
      alert("Failed to set budget: " + (err?.message || "Organizer permission required"));
    } finally {
      setSubmittingBudget(false);
    }
  };

  const getPositionBadge = (pos?: string) => {
    if (pos === "RECEIVES") {
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">You Receive</Badge>;
    }
    if (pos === "OWES") {
      return <Badge variant="destructive">You Owe</Badge>;
    }
    return <Badge variant="secondary">Settled Up</Badge>;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                  Mana Trip Split & Expenses
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {trip.title} • {trip.destination}
                </DialogDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="overview">Overview & Budget</TabsTrigger>
              <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
              <TabsTrigger value="settlements">Who Owes Whom ({settlements.length})</TabsTrigger>
            </TabsList>

            {/* ── TAB 1: OVERVIEW & BUDGET ────────────────────────── */}
            <TabsContent value="overview" className="space-y-4 pt-3">
              {/* Personal Position Card */}
              <Card className="border-emerald-100 bg-emerald-50/40">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-emerald-950 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Your Position in this Trip
                    </CardTitle>
                    {dashboard && (
                      dashboard.youReceive > 0
                        ? getPositionBadge("RECEIVES")
                        : dashboard.youOwe > 0
                        ? getPositionBadge("OWES")
                        : getPositionBadge("SETTLED")
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">Your Share</p>
                      <p className="text-lg font-bold text-gray-900">₹{dashboard?.yourShare?.toLocaleString() || "0"}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">You Paid</p>
                      <p className="text-lg font-bold text-gray-900">₹{dashboard?.youPaid?.toLocaleString() || "0"}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">You Receive</p>
                      <p className="text-lg font-bold text-emerald-600">₹{dashboard?.youReceive?.toLocaleString() || "0"}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">You Owe</p>
                      <p className="text-lg font-bold text-red-600">₹{dashboard?.youOwe?.toLocaleString() || "0"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trip Budget KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardHeader className="p-3 pb-1">
                    <p className="text-xs text-muted-foreground">Estimated Budget</p>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xl font-bold text-gray-900">
                      {dashboard?.estimated != null ? `₹${dashboard.estimated.toLocaleString()}` : "Not set"}
                    </p>
                    {isOrganizer && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs text-emerald-600"
                        onClick={() => {
                          setBudgetEstimate(dashboard?.estimated ? String(dashboard.estimated) : "");
                          setIsSetBudgetOpen(true);
                        }}
                      >
                        {dashboard?.estimated != null ? "Change budget" : "Set budget"}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-3 pb-1">
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xl font-bold text-emerald-700">₹{dashboard?.spent?.toLocaleString() || "0"}</p>
                    <p className="text-xs text-muted-foreground">{expenses.filter(e => e.status === "ACTIVE").length} split expenses</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-3 pb-1">
                    <p className="text-xs text-muted-foreground">Remaining Budget</p>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className={`text-xl font-bold ${(dashboard?.remaining ?? 0) < 0 ? "text-red-600" : "text-gray-900"}`}>
                      {dashboard?.remaining != null ? `₹${dashboard.remaining.toLocaleString()}` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dashboard?.remaining != null && dashboard.remaining < 0 ? "Over budget" : "Available"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-3 pb-1">
                    <p className="text-xs text-muted-foreground">Unsplit Expenses</p>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xl font-bold text-amber-600">₹{dashboard?.unsplit?.toLocaleString() || "0"}</p>
                    <p className="text-xs text-muted-foreground">Pending organizer split</p>
                  </CardContent>
                </Card>
              </div>

              {/* Spend by Category */}
              {dashboard?.spentByCategory && Object.keys(dashboard.spentByCategory).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-emerald-600" />
                      Spending by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(dashboard.spentByCategory).map(([cat, amt]) => {
                      const total = dashboard.spent || 1;
                      const pct = Math.round((amt / total) * 100);
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-gray-700">{cat}</span>
                            <span className="text-muted-foreground">₹{amt.toLocaleString()} ({pct}%)</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* My Money Opt-In Preference */}
              <Card className="border-indigo-100 bg-indigo-50/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-950">
                        <ShieldCheck className="h-4 w-4 text-indigo-600" />
                        My Money Integration (Privacy Protected)
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Trip expense data stays strictly inside this trip. Opt in below to reflect your personal share in your private My Money ledger.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-indigo-300 text-indigo-700">
                      Mode: {myMoneyMode}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button
                      variant={myMoneyMode === "OFF" ? "default" : "outline"}
                      size="sm"
                      className="justify-start text-xs h-auto py-2"
                      disabled={updatingPref}
                      onClick={() => handleUpdatePreference("OFF")}
                    >
                      <div>
                        <div className="font-semibold">OFF (Isolated)</div>
                        <div className="text-[10px] text-muted-foreground">No data flows to My Money</div>
                      </div>
                    </Button>

                    <Button
                      variant={myMoneyMode === "SHARE" ? "default" : "outline"}
                      size="sm"
                      className="justify-start text-xs h-auto py-2"
                      disabled={updatingPref}
                      onClick={() => handleUpdatePreference("SHARE")}
                    >
                      <div>
                        <div className="font-semibold">SHARE (Recommended)</div>
                        <div className="text-[10px] text-muted-foreground">Sync your exact share of active expenses</div>
                      </div>
                    </Button>

                    <Button
                      variant={myMoneyMode === "SETTLEMENTS" ? "default" : "outline"}
                      size="sm"
                      className="justify-start text-xs h-auto py-2"
                      disabled={updatingPref}
                      onClick={() => handleUpdatePreference("SETTLEMENTS")}
                    >
                      <div>
                        <div className="font-semibold">SETTLEMENTS</div>
                        <div className="text-[10px] text-muted-foreground">Sync reimbursement transfers only</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── TAB 2: EXPENSES ─────────────────────────────────── */}
            <TabsContent value="expenses" className="space-y-3 pt-3">
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Track who paid for what and how it was divided among members.
                </p>
                <Button size="sm" onClick={() => setIsAddExpenseOpen(true)} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4" />
                  Record Expense
                </Button>
              </div>

              {expenses.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed">
                  <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">No expenses recorded yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Record Expense" to log hotels, fuel, food, or activity tickets.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map((exp) => (
                    <Card key={exp.id} className={exp.status === "VOIDED" ? "opacity-50" : ""}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">{exp.description}</span>
                            <Badge variant="outline" className="text-[10px] uppercase">{exp.categoryCode}</Badge>
                            {exp.status === "UNSPLIT" && (
                              <Badge variant="secondary" className="text-[10px] text-amber-700 bg-amber-50">Split Later</Badge>
                            )}
                            {exp.status === "VOIDED" && (
                              <Badge variant="destructive" className="text-[10px]">Voided</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Paid by <strong className="text-gray-700">{exp.paidByName}</strong></span>
                            <span>•</span>
                            <span>{exp.expenseDate}</span>
                            {exp.splitMethod && (
                              <>
                                <span>•</span>
                                <span>Split: {exp.splitMethod}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-bold text-sm text-gray-900">₹{exp.totalAmount.toLocaleString()}</div>
                            {exp.shares && exp.shares.length > 0 && (
                              <div className="text-[10px] text-muted-foreground">
                                {exp.shares.length} participants
                              </div>
                            )}
                          </div>
                          {exp.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 p-1 h-auto"
                              title="Void Expense"
                              onClick={() => handleVoidExpense(exp.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── TAB 3: WHO OWES WHOM (SETTLEMENTS) ───────────────── */}
            <TabsContent value="settlements" className="space-y-4 pt-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Minimized Settlement Transfers</h4>
                  <p className="text-xs text-muted-foreground">
                    Calculated by the engine to settle everyone with the minimum number of payments.
                  </p>
                </div>
                <Button size="sm" onClick={() => setIsRecordPaymentOpen(true)} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                  <DollarSign className="h-4 w-4" />
                  Settle Up / Record Payment
                </Button>
              </div>

              {settlements.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">All balances are settled!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No participant owes any money at this moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {settlements.map((s, idx) => (
                    <Card key={idx} className="border-emerald-100 bg-gradient-to-r from-emerald-50/20 to-white">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900">{s.fromName}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-semibold text-sm text-emerald-700">{s.toName}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Direct optimized settlement</p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-bold text-gray-900">₹{s.amount.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Recorded Peer Reimbursements */}
              {payments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Payment Confirmations & History
                  </h4>
                  <div className="space-y-2">
                    {payments.map((p) => {
                      const canDecide =
                        p.status === "PENDING" &&
                        (String(p.toUserId) === String(currentUserId) || isOrganizer);

                      return (
                        <Card key={p.id}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 text-xs">
                                <strong>{p.fromName}</strong> paid <strong>{p.toName}</strong>
                                <Badge
                                  variant={
                                    p.status === "CONFIRMED"
                                      ? "default"
                                      : p.status === "REJECTED"
                                      ? "destructive"
                                      : "outline"
                                  }
                                  className="text-[10px]"
                                >
                                  {p.status}
                                </Badge>
                              </div>
                              <div className="text-[11px] text-muted-foreground flex gap-2">
                                <span>Method: {p.method || "Direct"}</span>
                                {p.reference && <span>• Ref: {p.reference}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-900">₹{p.amount.toLocaleString()}</span>
                              {canDecide && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleConfirmPayment(p.id)}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-red-600 border-red-300"
                                    onClick={() => handleRejectPayment(p.id)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SUB-DIALOG: RECORD EXPENSE ────────────────────────── */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Trip Expense</DialogTitle>
            <DialogDescription>
              Add a bill paid by you or another participant.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateExpense} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Category</label>
              <select
                className="w-full mt-1 border rounded-md p-2 text-sm bg-white"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Description</label>
              <Input
                placeholder="e.g. Goa Beach Resort booking, Fuel stop"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Total Amount (₹)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Split Method</label>
              <select
                className="w-full mt-1 border rounded-md p-2 text-sm bg-white"
                value={newSplitMethod}
                onChange={(e) => setNewSplitMethod(e.target.value as any)}
              >
                <option value="EQUAL">Equal (All confirmed participants)</option>
                <option value="SHARES">Family / Group Shares (Weights)</option>
                <option value="EXACT">Exact Amount per person</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="QUANTITY">Quantity (e.g. 3 rooms, 5 tickets)</option>
                <option value="">Split Later (Unsplit Expense)</option>
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Largest-remainder arithmetic ensures zero lost paise across shares.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submittingExpense} className="bg-emerald-600 hover:bg-emerald-700">
                {submittingExpense ? "Recording..." : "Save Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── SUB-DIALOG: SET BUDGET ────────────────────────────── */}
      <Dialog open={isSetBudgetOpen} onOpenChange={setIsSetBudgetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Trip Budget</DialogTitle>
            <DialogDescription>
              Organizer control: set estimated overall spending for this trip.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSetBudget} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Estimated Total (₹)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 50000"
                value={budgetEstimate}
                onChange={(e) => setBudgetEstimate(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSetBudgetOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submittingBudget} className="bg-emerald-600 hover:bg-emerald-700">
                {submittingBudget ? "Saving..." : "Set Budget"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── SUB-DIALOG: RECORD PAYMENT ────────────────────────── */}
      <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Reimbursement Payment</DialogTitle>
            <DialogDescription>
              Log a payment you made to another participant. They will confirm it once received.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Paid To Participant</label>
              <select
                className="w-full mt-1 border rounded-md p-2 text-sm bg-white"
                value={payToUserId}
                onChange={(e) => setPayToUserId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="">-- Select Creditor --</option>
                {settlements.map((s) => (
                  <option key={s.toUserId} value={s.toUserId}>
                    {s.toName} (Owed up to ₹{s.amount.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Amount Paid (₹)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700">Payment Method</label>
                <select
                  className="w-full mt-1 border rounded-md p-2 text-sm bg-white"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                >
                  <option value="UPI">UPI</option>
                  <option value="IMPS">Bank Transfer / IMPS</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">UTR / Reference</label>
                <Input
                  placeholder="UPI Ref ID"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRecordPaymentOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submittingPayment} className="bg-emerald-600 hover:bg-emerald-700">
                {submittingPayment ? "Recording..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
