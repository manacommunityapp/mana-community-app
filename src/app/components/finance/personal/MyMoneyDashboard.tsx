import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Shield,
  ShieldCheck,
  CreditCard,
  Landmark,
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Target,
  PieChart,
  ShoppingBag,
  Building,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  DollarSign,
  Layers,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  FileText
} from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../ui/dialog";
import { Input } from "../../ui/input";
import {
  personalFinanceService,
  type PersonalAccountDto,
  type PersonalTransactionDto,
  type PersonalBudgetDto,
  type PersonalGoalDto,
  type PersonalReceiptDto,
  type DashboardSummaryDto,
  type TransactionType,
  type AccountType,
  type CredInsightsSummaryDto,
} from "../../../../services/finance/personalFinanceService";
import { useAuth } from "../../../../contexts/AuthContext";
import { CredInsightsView } from "./CredInsightsView";

type TabKey = "overview" | "insights" | "accounts" | "transactions" | "budgets" | "goals" | "receipts";

export const MyMoneyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [hideBalances, setHideBalances] = useState(false);
  const [activeSpendBucket, setActiveSpendBucket] = useState<"community" | "other">("community");

  // Live state
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [insights, setInsights] = useState<CredInsightsSummaryDto | null>(null);
  const [accounts, setAccounts] = useState<PersonalAccountDto[]>([]);
  const [transactions, setTransactions] = useState<PersonalTransactionDto[]>([]);
  const [budgets, setBudgets] = useState<PersonalBudgetDto[]>([]);
  const [goals, setGoals] = useState<PersonalGoalDto[]>([]);
  const [receipts, setReceipts] = useState<PersonalReceiptDto[]>([]);

  // Dialog States
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddTxnModal, setShowAddTxnModal] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showContributeGoalModal, setShowContributeGoalModal] = useState<PersonalGoalDto | null>(null);
  const [showUploadReceiptModal, setShowUploadReceiptModal] = useState(false);

  // Form States
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "SAVINGS" as AccountType,
    balance: 0,
    bankName: "",
    accountNumber: "",
    creditLimit: 0,
  });

  const [newTxn, setNewTxn] = useState({
    type: "EXPENSE" as TransactionType,
    amount: 0,
    accountId: "",
    categoryId: "cat-1",
    description: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [newBudget, setNewBudget] = useState({
    categoryId: "cat-1",
    limitAmount: 5000,
    alertThreshold: 80,
  });

  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: 50000,
    currentAmount: 5000,
    targetDate: "2027-03-31",
    notes: "",
  });

  const [contributeAmount, setContributeAmount] = useState<number>(2000);
  const [contributeAccountId, setContributeAccountId] = useState<string>("");

  const [newReceipt, setNewReceipt] = useState({
    merchantName: "",
    amount: 0,
    category: "Housing & Society",
    notes: "",
    imageUrl: "",
  });

  // Filter States for Transactions
  const [txnSearch, setTxnSearch] = useState("");
  const [txnTypeFilter, setTxnTypeFilter] = useState<"ALL" | TransactionType>("ALL");

  const refreshData = () => {
    const sum = personalFinanceService.getDashboardSummary();
    const credInsights = personalFinanceService.getCredInsightsSummary();
    const accs = personalFinanceService.getAccounts();
    const txs = personalFinanceService.getTransactions();
    const bgts = personalFinanceService.getBudgets();
    const gls = personalFinanceService.getGoals();
    const rcps = personalFinanceService.getReceipts();

    setSummary(sum);
    setInsights(credInsights);
    setAccounts(accs);
    setTransactions(txs);
    setBudgets(bgts);
    setGoals(gls);
    setReceipts(rcps);

    if (accs.length > 0 && !newTxn.accountId) {
      setNewTxn((prev) => ({ ...prev, accountId: accs[0].id }));
    }
    if (accs.length > 0 && !contributeAccountId) {
      setContributeAccountId(accs[0].id);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(txnSearch.toLowerCase()) ||
        t.categoryName.toLowerCase().includes(txnSearch.toLowerCase()) ||
        t.accountName.toLowerCase().includes(txnSearch.toLowerCase());
      const matchesType = txnTypeFilter === "ALL" || t.type === txnTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [transactions, txnSearch, txnTypeFilter]);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.name) return;
    personalFinanceService.createAccount({
      name: newAccount.name,
      type: newAccount.type,
      balance: Number(newAccount.balance),
      currency: "₹",
      bankName: newAccount.bankName || "Self",
      accountNumber: newAccount.accountNumber || "••••0000",
      creditLimit: newAccount.type === "CREDIT_CARD" ? Number(newAccount.creditLimit) : undefined,
      color: newAccount.type === "CREDIT_CARD" ? "#8B5CF6" : "#3B82F6",
      icon: newAccount.type === "CREDIT_CARD" ? "CreditCard" : "Landmark",
    });
    setShowAddAccountModal(false);
    setNewAccount({ name: "", type: "SAVINGS", balance: 0, bankName: "", accountNumber: "", creditLimit: 0 });
    refreshData();
  };

  const handleCreateTxn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxn.amount || !newTxn.description) return;
    personalFinanceService.createTransaction({
      type: newTxn.type,
      amount: Number(newTxn.amount),
      accountId: newTxn.accountId || accounts[0]?.id || "acc-1",
      categoryId: newTxn.categoryId,
      description: newTxn.description,
      notes: newTxn.notes,
      date: newTxn.date,
    });
    setShowAddTxnModal(false);
    setNewTxn((prev) => ({ ...prev, amount: 0, description: "", notes: "" }));
    refreshData();
  };

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    personalFinanceService.createBudget({
      categoryId: newBudget.categoryId,
      limitAmount: Number(newBudget.limitAmount),
      alertThreshold: Number(newBudget.alertThreshold),
    });
    setShowAddBudgetModal(false);
    refreshData();
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name) return;
    personalFinanceService.createGoal({
      name: newGoal.name,
      targetAmount: Number(newGoal.targetAmount),
      currentAmount: Number(newGoal.currentAmount),
      targetDate: newGoal.targetDate,
      notes: newGoal.notes,
    });
    setShowAddGoalModal(false);
    setNewGoal({ name: "", targetAmount: 50000, currentAmount: 5000, targetDate: "2027-03-31", notes: "" });
    refreshData();
  };

  const handleContributeGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showContributeGoalModal || contributeAmount <= 0) return;
    personalFinanceService.contributeToGoal(showContributeGoalModal.id, Number(contributeAmount), contributeAccountId);
    setShowContributeGoalModal(null);
    refreshData();
  };

  const handleUploadReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReceipt.merchantName) return;
    personalFinanceService.uploadReceipt({
      merchantName: newReceipt.merchantName,
      amount: Number(newReceipt.amount),
      category: newReceipt.category,
      notes: newReceipt.notes,
      imageUrl: newReceipt.imageUrl || "https://images.unsplash.com/photo-1554415707-9e49017a1430?w=600&auto=format&fit=crop&q=80",
    });
    setShowUploadReceiptModal(false);
    setNewReceipt({ merchantName: "", amount: 0, category: "Housing & Society", notes: "", imageUrl: "" });
    refreshData();
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC] pb-24 text-slate-900">
      {/* ── Top Header / Hero ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0]">
                  <Wallet className="w-5 h-5" />
                </span>
                <h4 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  My Money & Finance
                </h4>
                <Badge className="bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] hover:bg-[#E6FAF5] font-semibold text-xs">
                  Zero-Knowledge Privacy
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Your private resident personal financial suite. Society administration has zero access to your personal ledgers.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHideBalances(!hideBalances)}
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {hideBalances ? <EyeOff className="w-4 h-4 mr-1.5" /> : <Eye className="w-4 h-4 mr-1.5" />}
                {hideBalances ? "Show Figures" : "Mask Figures"}
              </Button>
              <Button
                onClick={() => setShowAddTxnModal(true)}
                className="bg-[#00D09C] hover:bg-[#008767] text-white shadow-xs font-semibold"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Record
              </Button>
            </div>
          </div>

          {/* ── Tabs Bar ── */}
          <div className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-slate-100 mt-4 scrollbar-none">
            {[
              { key: "overview", label: "Financial Overview", icon: PieChart },
              {
                key: "insights",
                label: "CRED Insights",
                icon: Sparkles,
                badgeText: (insights?.duplicateWarnings.length || 0) > 0 ? "Alert" : "Smart",
              },
              { key: "accounts", label: "Accounts & Cards", icon: Landmark, count: accounts.length },
              { key: "transactions", label: "Ledger", icon: FileText, count: transactions.length },
              { key: "budgets", label: "Envelope Budgets", icon: Layers, count: budgets.length },
              { key: "goals", label: "Savings Goals", icon: Target, count: goals.length },
              { key: "receipts", label: "Receipts Vault", icon: Receipt, count: receipts.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabKey)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {"badgeText" in tab && tab.badgeText && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        tab.badgeText === "Alert"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {tab.badgeText}
                    </span>
                  )}
                  {tab.count !== undefined && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        isActive ? "bg-[#008767] text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Privacy & Security Banner ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-950">
                Client-Encrypted Zero-Knowledge Isolation
              </p>
              <p className="text-xs text-emerald-800">
                Only community maintenance, bookings, and verified dues link automatically. All bank cards, salary credits, and outside spending remain 100% confidential to your personal device.
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
            Encrypted Device Vault
          </Badge>
        </div>
      </div>

      {/* ── Main Container ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Net Worth & Key Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Net Worth */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Calculated Net Worth
                  </span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <PiggyBank className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {hideBalances ? "••••••" : `₹${(summary?.netWorth || 0).toLocaleString("en-IN")}`}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Healthy positive liquidity</span>
                </div>
              </div>

              {/* Liquid Assets */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Assets & Cash
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {hideBalances ? "••••••" : `₹${(summary?.totalAssets || 0).toLocaleString("en-IN")}`}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <span>Across {accounts.length} connected accounts</span>
                </div>
              </div>

              {/* Total Liabilities */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Liabilities / CC
                  </span>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {hideBalances ? "••••••" : `₹${(summary?.totalLiabilities || 0).toLocaleString("en-IN")}`}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <span>Credit card bill & active dues</span>
                </div>
              </div>

              {/* Monthly Savings Rate */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Savings Rate (Oct)
                  </span>
                  <div className="p-2 bg-[#E6FAF5] text-[#008767] rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-[#008767] tracking-tight">
                    {summary?.savingsRate || 0}%
                  </span>
                  <Badge className="bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0]">
                    Net +₹{(summary?.netSavings || 0).toLocaleString("en-IN")}
                  </Badge>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-[#00D09C] h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, summary?.savingsRate || 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Dual-Bucket Community Spending Breakdown */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-bold text-slate-900">
                      Dual-Bucket Expense Classification
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Understand how much goes to Mana society living vs your outside household expenses.
                  </p>
                </div>

                <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setActiveSpendBucket("community")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeSpendBucket === "community"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    Community Living (₹{(summary?.totalCommunitySpending || 0).toLocaleString("en-IN")})
                  </button>
                  <button
                    onClick={() => setActiveSpendBucket("other")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeSpendBucket === "other"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    Personal & Household (₹{(summary?.totalOtherSpending || 0).toLocaleString("en-IN")})
                  </button>
                </div>
              </div>

              {activeSpendBucket === "community" ? (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(summary?.communitySpendingBreakdown || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                            <Building className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{item.label}</p>
                            <p className="text-xs text-slate-500">
                              {item.transactionCount} transactions · {item.percentage}% of community spend
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">
                            {hideBalances ? "••••" : `₹${item.amount.toLocaleString("en-IN")}`}
                          </p>
                          <Badge className="bg-indigo-100 text-indigo-700 border-none text-[10px]">
                            Auto-Audited
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Maintenance Dues, Event passes & Trip EMIs sync with your Bills & Autopay Hub.
                    </span>
                    <div className="flex items-center gap-3">
                      <a
                        href="/finance/bills"
                        className="text-[#008767] font-bold flex items-center gap-1 hover:underline"
                      >
                        Mana Bills & Autopay <ChevronRight className="w-3 h-3" />
                      </a>
                      <a
                        href="/finance/maintenance"
                        className="text-slate-500 font-semibold flex items-center gap-1 hover:underline"
                      >
                        Society Invoices <ChevronRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(summary?.otherSpendingBreakdown || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2.5 rounded-xl text-white"
                            style={{ backgroundColor: item.color || "#6B7280" }}
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{item.label}</p>
                            <p className="text-xs text-slate-500">
                              {item.transactionCount} records · {item.percentage}% of personal spend
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">
                            {hideBalances ? "••••" : `₹${item.amount.toLocaleString("en-IN")}`}
                          </p>
                          <Badge className="bg-slate-100 text-slate-700 border-none text-[10px]">
                            Private Record
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Ledger & Budget Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity Stream */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className="text-xs font-semibold text-[#008767] hover:underline flex items-center gap-0.5"
                  >
                    View All ({transactions.length}) <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 mt-2">
                  {summary?.recentTransactions.slice(0, 5).map((txn) => (
                    <div key={txn.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl text-white ${
                            txn.type === "INCOME" ? "bg-emerald-500" : "bg-slate-700"
                          }`}
                        >
                          {txn.type === "INCOME" ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-slate-900">
                            {txn.description}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {txn.categoryName} · {txn.accountName} · {txn.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-xs sm:text-sm font-bold ${
                            txn.type === "INCOME" ? "text-emerald-600" : "text-slate-900"
                          }`}
                        >
                          {txn.type === "INCOME" ? "+" : "-"}
                          {hideBalances ? "••••" : `₹${txn.amount.toLocaleString("en-IN")}`}
                        </p>
                        {txn.isManaProjection && (
                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] py-0">
                            Mana Sync
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Envelope Budget Status */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#008767]" />
                    <h3 className="text-sm font-bold text-slate-900">Envelope Budgets (Pace)</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("budgets")}
                    className="text-xs font-semibold text-[#008767] hover:underline flex items-center gap-0.5"
                  >
                    Manage Budgets <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-4 mt-3">
                  {budgets.slice(0, 3).map((b) => (
                    <div key={b.id} className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800">{b.categoryName}</span>
                        <span className="font-semibold text-slate-600">
                          ₹{b.spentAmount.toLocaleString("en-IN")} of ₹{b.limitAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            b.percentUsed >= 90
                              ? "bg-rose-500"
                              : b.percentUsed >= 70
                              ? "bg-amber-500"
                              : "bg-[#00D09C]"
                          }`}
                          style={{ width: `${Math.min(100, b.percentUsed)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>{b.percentUsed}% consumed</span>
                        <span className="text-emerald-700 font-medium">
                          ₹{b.remainingAmount.toLocaleString("en-IN")} remaining
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ACCOUNTS & CARDS TAB ── */}
        {activeTab === "accounts" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Accounts & Connected Wallets</h2>
                <p className="text-xs text-slate-500">
                  Manage bank accounts, credit cards, UPI handles, and cash reserves securely.
                </p>
              </div>
              <Button
                onClick={() => setShowAddAccountModal(true)}
                className="bg-[#00D09C] hover:bg-[#008767] text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Account
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-xl text-white shadow-xs"
                        style={{ backgroundColor: acc.color || "#3B82F6" }}
                      >
                        {acc.type === "CREDIT_CARD" ? (
                          <CreditCard className="w-5 h-5" />
                        ) : (
                          <Landmark className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{acc.name}</h4>
                        <p className="text-xs text-slate-500">
                          {acc.bankName} · {acc.accountNumber}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-slate-100 text-slate-700 border-none text-[10px]">
                      {acc.type}
                    </Badge>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {acc.type === "CREDIT_CARD" ? "Outstanding Due" : "Available Balance"}
                      </span>
                      <div className="text-xl font-black text-slate-900 tracking-tight">
                        {hideBalances ? "••••••" : `₹${Math.abs(acc.balance).toLocaleString("en-IN")}`}
                      </div>
                    </div>

                    {acc.creditLimit && (
                      <div className="text-right text-[11px] text-slate-500">
                        Limit: ₹{acc.creditLimit.toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TRANSACTIONS LEDGER TAB ── */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Personal Transactions Ledger</h2>
                <p className="text-xs text-slate-500">
                  Real-time record of your income, household expenses, and linked community payments.
                </p>
              </div>
              <Button
                onClick={() => setShowAddTxnModal(true)}
                className="bg-[#00D09C] hover:bg-[#008767] text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Record Transaction
              </Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  placeholder="Search by description, category, or account..."
                  value={txnSearch}
                  onChange={(e) => setTxnSearch(e.target.value)}
                  className="pl-9 text-xs sm:text-sm bg-slate-50 border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {(["ALL", "EXPENSE", "INCOME"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTxnTypeFilter(type)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      txnTypeFilter === type
                        ? "bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0]"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Description</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Account</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{t.description}</div>
                          {t.isManaProjection && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-medium mt-0.5">
                              Mana Synced: {t.sourceLabel || "Society Invoice"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: t.categoryColor || "#6B7280" }}
                            />
                            {t.categoryName}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{t.accountName}</td>
                        <td className="px-5 py-3.5 text-slate-500">{t.date}</td>
                        <td className="px-5 py-3.5 text-right font-bold">
                          <span
                            className={t.type === "INCOME" ? "text-emerald-600" : "text-slate-900"}
                          >
                            {t.type === "INCOME" ? "+" : "-"}
                            {hideBalances ? "••••" : `₹${t.amount.toLocaleString("en-IN")}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ENVELOPE BUDGETS TAB ── */}
        {activeTab === "budgets" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Envelope Spending Budgets</h2>
                <p className="text-xs text-slate-500">
                  Control monthly expenditure per category with intelligent pace warnings.
                </p>
              </div>
              <Button
                onClick={() => setShowAddBudgetModal(true)}
                className="bg-[#00D09C] hover:bg-[#008767] text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Budget
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {budgets.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{b.categoryName}</h4>
                      <Badge
                        className={`text-[10px] ${
                          b.isOverspent
                            ? "bg-rose-100 text-rose-800"
                            : b.percentUsed >= b.alertThreshold
                            ? "bg-amber-100 text-amber-800"
                            : "bg-[#E6FAF5] text-[#008767]"
                        }`}
                      >
                        {b.percentUsed}% spent
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between">
                      <span className="text-xl font-black text-slate-900">
                        {hideBalances ? "••••" : `₹${b.spentAmount.toLocaleString("en-IN")}`}
                      </span>
                      <span className="text-xs text-slate-500">
                        Limit: ₹{b.limitAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full ${
                          b.isOverspent
                            ? "bg-rose-500"
                            : b.percentUsed >= b.alertThreshold
                            ? "bg-amber-500"
                            : "bg-[#00D09C]"
                        }`}
                        style={{ width: `${Math.min(100, b.percentUsed)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Threshold: {b.alertThreshold}%</span>
                    <span className="font-semibold text-emerald-700">
                      ₹{b.remainingAmount.toLocaleString("en-IN")} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SAVINGS GOALS TAB ── */}
        {activeTab === "goals" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Financial Targets & Savings Goals</h2>
                <p className="text-xs text-slate-500">
                  Target emergency funds, vacation funds, or annual community advance maintenance.
                </p>
              </div>
              <Button
                onClick={() => setShowAddGoalModal(true)}
                className="bg-[#00D09C] hover:bg-[#008767] text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Goal
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {goals.map((g) => (
                <div
                  key={g.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#008767]" />
                        <h4 className="text-sm font-bold text-slate-900">{g.name}</h4>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                        {g.percentAchieved}% Done
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between">
                      <span className="text-xl font-black text-slate-900">
                        {hideBalances ? "••••" : `₹${g.currentAmount.toLocaleString("en-IN")}`}
                      </span>
                      <span className="text-xs text-slate-500">
                        Target: ₹{g.targetAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                      <div
                        className="bg-[#00D09C] h-2.5 rounded-full"
                        style={{ width: `${Math.min(100, g.percentAchieved)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">
                      Save ₹{g.requiredMonthlySavings.toLocaleString("en-IN")}/mo
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowContributeGoalModal(g)}
                      className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 h-8 text-xs font-semibold"
                    >
                      Contribute
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RECEIPTS VAULT TAB ── */}
        {activeTab === "receipts" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Receipts & Invoice Vault</h2>
                <p className="text-xs text-slate-500">
                  Archived maintenance bills, purchase proofs, and contractor work receipts.
                </p>
              </div>
              <Button
                onClick={() => setShowUploadReceiptModal(true)}
                className="bg-[#00D09C] hover:bg-[#008767] text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Upload Receipt
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {receipts.map((rcp) => (
                <div
                  key={rcp.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={rcp.imageUrl}
                      alt={rcp.merchantName}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{rcp.merchantName}</h4>
                      <p className="text-xs text-slate-500">{rcp.category}</p>
                      <p className="text-xs text-slate-400 mt-1">{rcp.date}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      ₹{rcp.amount.toLocaleString("en-IN")}
                    </span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                      OCR Verified
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CRED INSIGHTS TAB ── */}
        {activeTab === "insights" && (
          <CredInsightsView
            insights={insights}
            hideBalances={hideBalances}
            onRefresh={refreshData}
          />
        )}
      </div>

      {/* ── MODAL: ADD ACCOUNT ── */}
      <Dialog open={showAddAccountModal} onOpenChange={setShowAddAccountModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Add Financial Account</DialogTitle>
            <DialogDescription>
              Link a savings account, credit card, cash reserve, or digital wallet.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Account Name</label>
              <Input
                placeholder="e.g. Axis Salary, ICICI Coral"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Type</label>
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as AccountType })}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="WALLET">Digital Wallet</option>
                  <option value="CASH">Cash Reserve</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Starting Balance (₹)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount({ ...newAccount, balance: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Bank / Institution</label>
              <Input
                placeholder="e.g. HDFC Bank, SBI"
                value={newAccount.bankName}
                onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Masked Account Number</label>
              <Input
                placeholder="••••1234"
                value={newAccount.accountNumber}
                onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
              />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddAccountModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#00D09C] hover:bg-[#008767] text-white">
                Save Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: RECORD TRANSACTION ── */}
      <Dialog open={showAddTxnModal} onOpenChange={setShowAddTxnModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Record Transaction</DialogTitle>
            <DialogDescription>
              Add an income entry or household expense to your personal ledger.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTxn} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Transaction Type</label>
                <select
                  value={newTxn.type}
                  onChange={(e) => setNewTxn({ ...newTxn, type: e.target.value as TransactionType })}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newTxn.amount || ""}
                  onChange={(e) => setNewTxn({ ...newTxn, amount: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <Input
                placeholder="e.g. Organic Groceries, Amazon purchase"
                value={newTxn.description}
                onChange={(e) => setNewTxn({ ...newTxn, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Account</label>
                <select
                  value={newTxn.accountId}
                  onChange={(e) => setNewTxn({ ...newTxn, accountId: e.target.value })}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Date</label>
                <Input
                  type="date"
                  value={newTxn.date}
                  onChange={(e) => setNewTxn({ ...newTxn, date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddTxnModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#00D09C] hover:bg-[#008767] text-white">
                Add to Ledger
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: ADD BUDGET ── */}
      <Dialog open={showAddBudgetModal} onOpenChange={setShowAddBudgetModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Set Envelope Budget</DialogTitle>
            <DialogDescription>Configure a spending cap for a specific category.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBudget} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                value={newBudget.categoryId}
                onChange={(e) => setNewBudget({ ...newBudget, categoryId: e.target.value })}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
              >
                <option value="cat-1">Housing & Society</option>
                <option value="cat-2">Food & Groceries</option>
                <option value="cat-3">Utilities & Bills</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Monthly Limit (₹)</label>
              <Input
                type="number"
                value={newBudget.limitAmount}
                onChange={(e) => setNewBudget({ ...newBudget, limitAmount: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Alert Threshold (%)</label>
              <Input
                type="number"
                value={newBudget.alertThreshold}
                onChange={(e) => setNewBudget({ ...newBudget, alertThreshold: Number(e.target.value) })}
                required
              />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddBudgetModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#00D09C] hover:bg-[#008767] text-white">
                Save Budget
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: ADD GOAL ── */}
      <Dialog open={showAddGoalModal} onOpenChange={setShowAddGoalModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Create Savings Target</DialogTitle>
            <DialogDescription>Define a goal and track your monthly pace.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Goal Name</label>
              <Input
                placeholder="e.g. Annual Maintenance Advance, Trip to Goa"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Target Amount (₹)</label>
                <Input
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Current Savings (₹)</label>
                <Input
                  type="number"
                  value={newGoal.currentAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, currentAmount: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddGoalModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#00D09C] hover:bg-[#008767] text-white">
                Create Goal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: CONTRIBUTE TO GOAL ── */}
      <Dialog open={!!showContributeGoalModal} onOpenChange={(open) => !open && setShowContributeGoalModal(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Contribute to {showContributeGoalModal?.name}</DialogTitle>
            <DialogDescription>Allocate savings towards this target.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleContributeGoal} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Amount (₹)</label>
              <Input
                type="number"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Deduct from Account</label>
              <select
                value={contributeAccountId}
                onChange={(e) => setContributeAccountId(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (₹{a.balance.toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowContributeGoalModal(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#00D09C] hover:bg-[#008767] text-white">
                Confirm Contribution
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: UPLOAD RECEIPT ── */}
      <Dialog open={showUploadReceiptModal} onOpenChange={setShowUploadReceiptModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Upload Receipt</DialogTitle>
            <DialogDescription>Add a purchase receipt or bill voucher to your vault.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadReceipt} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Merchant / Title</label>
              <Input
                placeholder="e.g. Society Maintenance Rec #104"
                value={newReceipt.merchantName}
                onChange={(e) => setNewReceipt({ ...newReceipt, merchantName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Amount (₹)</label>
              <Input
                type="number"
                value={newReceipt.amount || ""}
                onChange={(e) => setNewReceipt({ ...newReceipt, amount: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <Input
                placeholder="e.g. Housing & Society, Electrician"
                value={newReceipt.category}
                onChange={(e) => setNewReceipt({ ...newReceipt, category: e.target.value })}
              />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowUploadReceiptModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#00D09C] hover:bg-[#008767] text-white">
                Save Receipt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyMoneyDashboard;
