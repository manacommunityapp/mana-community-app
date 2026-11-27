import React, { useState, useEffect } from "react";
import {
  Building2, Receipt, BookOpen, Shield, Users, Play, CheckCircle2,
  AlertTriangle, Clock, ChevronRight, RefreshCw, ArrowRightLeft,
  Gauge, Database, Lock, Unlock, BarChart3, FileText, Zap
} from "lucide-react";
import { societyErpService } from "../../../services/finance/societyErpService";
import type {
  BillingRun, BillingRunRequest, BillingLineItem,
  LedgerAccount, LedgerEntry, TrialBalance,
  TenantMetrics, UserSocietyRoleInfo, SwitchResult
} from "../../../services/finance/societyErpService";
import { useAuth } from "../../../contexts/AuthContext";

type TabId = "billing" | "ledger" | "tenant" | "rbac";

export function SocietyErpDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("billing");

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "billing", label: "Billing Runs", icon: <Receipt className="w-4 h-4" /> },
    { id: "ledger", label: "General Ledger", icon: <BookOpen className="w-4 h-4" /> },
    { id: "tenant", label: "Tenant Isolation", icon: <Shield className="w-4 h-4" /> },
    { id: "rbac", label: "Role Switching", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-7 h-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Society ERP</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Billing, Ledger, Multi-Tenancy & RBAC
          </p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "billing" && <BillingRunsPanel />}
      {activeTab === "ledger" && <GeneralLedgerPanel />}
      {activeTab === "tenant" && <TenantIsolationPanel />}
      {activeTab === "rbac" && <RoleSwitchingPanel />}
    </div>
  );
}

// ── Billing Runs Panel ──────────────────────────────────────────────────────

function BillingRunsPanel() {
  const [runs, setRuns] = useState<BillingRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRun, setSelectedRun] = useState<BillingRun | null>(null);
  const [lineItems, setLineItems] = useState<BillingLineItem[]>([]);
  const [formData, setFormData] = useState<BillingRunRequest>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    maintenancePerSqft: 5,
    sinkingFund: 500,
    waterCharges: 300,
    parkingCharges: 0,
    applyGst: true,
    applyPenalty: false,
    dueDays: 15,
  });
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadRuns();
  }, []);

  async function loadRuns() {
    setLoading(true);
    try {
      const data = await societyErpService.getBillingRuns();
      setRuns(Array.isArray(data) ? data : []);
    } catch { setRuns([]); }
    setLoading(false);
  }

  async function startRun() {
    setIsRunning(true);
    try {
      await societyErpService.startBillingRun(formData);
      setShowForm(false);
      await loadRuns();
    } catch (e: any) {
      alert(e.message || "Billing run failed");
    }
    setIsRunning(false);
  }

  async function viewRunDetails(run: BillingRun) {
    setSelectedRun(run);
    try {
      const items = await societyErpService.getBillingRunLineItems(run.id);
      setLineItems(Array.isArray(items) ? items : []);
    } catch { setLineItems([]); }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      RUNNING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  if (selectedRun) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedRun(null)} className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1">
          &larr; Back to Billing Runs
        </button>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedRun.idempotencyKey}
            </h3>
            {statusBadge(selectedRun.status)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Flats" value={selectedRun.totalFlats} />
            <StatCard label="Processed" value={selectedRun.processedFlats} />
            <StatCard label="Failed" value={selectedRun.failedFlats} />
            <StatCard label="Total Amount" value={`₹${(selectedRun.totalAmount || 0).toLocaleString("en-IN")}`} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white">Line Items ({lineItems.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">Flat</th>
                  <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">Maintenance</th>
                  <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">Sinking</th>
                  <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">Water</th>
                  <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">GST</th>
                  <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">Penalty</th>
                  <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">Total</th>
                  <th className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700/50">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{item.flatNo}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">₹{item.maintenanceAmount}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">₹{item.sinkingFund}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">₹{item.waterCharges}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">₹{(item.cgst + item.sgst).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">₹{item.penaltyAmount}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">₹{item.totalAmount}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Idempotent Billing Runs
        </h2>
        <div className="flex gap-2">
          <button onClick={loadRuns} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            <Zap className="w-4 h-4" />
            New Billing Run
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-white">Configure Billing Run</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormField label="Month" type="number" value={formData.month}
              onChange={(v) => setFormData({ ...formData, month: Number(v) })} />
            <FormField label="Year" type="number" value={formData.year}
              onChange={(v) => setFormData({ ...formData, year: Number(v) })} />
            <FormField label="Maintenance/sqft (₹)" type="number" value={formData.maintenancePerSqft}
              onChange={(v) => setFormData({ ...formData, maintenancePerSqft: Number(v) })} />
            <FormField label="Sinking Fund (₹)" type="number" value={formData.sinkingFund}
              onChange={(v) => setFormData({ ...formData, sinkingFund: Number(v) })} />
            <FormField label="Water Charges (₹)" type="number" value={formData.waterCharges}
              onChange={(v) => setFormData({ ...formData, waterCharges: Number(v) })} />
            <FormField label="Parking Charges (₹)" type="number" value={formData.parkingCharges}
              onChange={(v) => setFormData({ ...formData, parkingCharges: Number(v) })} />
            <FormField label="Due Days" type="number" value={formData.dueDays}
              onChange={(v) => setFormData({ ...formData, dueDays: Number(v) })} />
            <div className="flex items-center gap-4 col-span-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={formData.applyGst}
                  onChange={(e) => setFormData({ ...formData, applyGst: e.target.checked })}
                  className="rounded border-gray-300" />
                Apply GST (18%)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={formData.applyPenalty}
                  onChange={(e) => setFormData({ ...formData, applyPenalty: e.target.checked })}
                  className="rounded border-gray-300" />
                Apply Late Penalty (2%)
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={startRun} disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
              <Play className="w-4 h-4" />
              {isRunning ? "Running..." : "Start Billing Run"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 text-sm">
              Cancel
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Idempotent: re-running the same month/year safely resumes without double-billing.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading billing runs...</div>
      ) : runs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No billing runs yet. Start one above.</div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <div key={run.id}
              onClick={() => viewRunDetails(run)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{run.idempotencyKey}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {run.processedFlats}/{run.totalFlats} flats | ₹{(run.totalAmount || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(run.status)}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── General Ledger Panel ────────────────────────────────────────────────────

function GeneralLedgerPanel() {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [view, setView] = useState<"accounts" | "journal" | "trial">("accounts");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    try {
      const data = await societyErpService.getChartOfAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch { setAccounts([]); }
    setLoading(false);
  }

  async function initializeLedger() {
    try {
      await societyErpService.initializeLedger();
      await loadAccounts();
    } catch (e: any) {
      alert(e.message || "Failed to initialize ledger");
    }
  }

  async function loadJournal() {
    setView("journal");
    try {
      const data = await societyErpService.getJournalEntries();
      setEntries(Array.isArray(data?.content) ? data.content : []);
    } catch { setEntries([]); }
  }

  async function loadTrialBalance() {
    setView("trial");
    try {
      const data = await societyErpService.getTrialBalance();
      setTrialBalance(data);
    } catch { setTrialBalance(null); }
  }

  const accountTypeColors: Record<string, string> = {
    ASSET: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
    LIABILITY: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20",
    EQUITY: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20",
    REVENUE: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20",
    EXPENSE: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Double-Entry General Ledger</h2>
        <div className="flex gap-2">
          <button onClick={() => { setView("accounts"); loadAccounts(); }}
            className={`px-3 py-1.5 text-sm rounded-md ${view === "accounts" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400"}`}>
            Chart of Accounts
          </button>
          <button onClick={loadJournal}
            className={`px-3 py-1.5 text-sm rounded-md ${view === "journal" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400"}`}>
            Journal Entries
          </button>
          <button onClick={loadTrialBalance}
            className={`px-3 py-1.5 text-sm rounded-md ${view === "trial" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400"}`}>
            Trial Balance
          </button>
        </div>
      </div>

      {view === "accounts" && (
        <>
          {accounts.length === 0 && !loading && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No ledger accounts found.</p>
              <button onClick={initializeLedger}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                Initialize Chart of Accounts
              </button>
            </div>
          )}
          {accounts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">Code</th>
                    <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">Account Name</th>
                    <th className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">Type</th>
                    <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acct) => (
                    <tr key={acct.id} className="border-t border-gray-100 dark:border-gray-700/50">
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{acct.accountCode}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{acct.accountName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${accountTypeColors[acct.accountType] || ""}`}>
                          {acct.accountType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                        ₹{(acct.currentBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {view === "journal" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No journal entries yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">Journal ID</th>
                  <th className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">Type</th>
                  <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">Amount</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">Narration</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">Posted</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-gray-100 dark:border-gray-700/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{entry.journalId.substring(0, 8)}...</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        entry.entryType === "DEBIT"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      }`}>{entry.entryType}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                      ₹{entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs truncate">{entry.narration}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(entry.postedAt).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {view === "trial" && trialBalance && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">FY {trialBalance.fiscalYear}</span>
              <span className={`flex items-center gap-1 text-sm font-medium ${
                trialBalance.balanced ? "text-green-600" : "text-red-600"
              }`}>
                {trialBalance.balanced ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {trialBalance.balanced ? "Balanced" : "Unbalanced"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400">Total Debits</p>
                <p className="text-lg font-bold text-blue-800 dark:text-blue-300">₹{trialBalance.totalDebits.toLocaleString("en-IN")}</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs text-green-600 dark:text-green-400">Total Credits</p>
                <p className="text-lg font-bold text-green-800 dark:text-green-300">₹{trialBalance.totalCredits.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">Code</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">Account</th>
                  <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">Debit</th>
                  <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">Credit</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.accounts.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-700/50">
                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{row.accountCode}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{row.accountName}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                      {row.debit > 0 ? `₹${row.debit.toLocaleString("en-IN")}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                      {row.credit > 0 ? `₹${row.credit.toLocaleString("en-IN")}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tenant Isolation Panel ──────────────────────────────────────────────────

function TenantIsolationPanel() {
  const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    setLoading(true);
    try {
      const data = await societyErpService.getTenantMetrics();
      setMetrics(data);
    } catch { setMetrics(null); }
    setLoading(false);
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading tenant metrics...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Multi-Tenant Isolation</h2>
        <button onClick={loadMetrics} className="p-2 text-gray-500 hover:text-gray-700">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-5 h-5 text-indigo-500" />
            <h3 className="font-medium text-gray-900 dark:text-white">Active Connections</h3>
          </div>
          <p className="text-3xl font-bold text-indigo-600">{metrics?.activeConnections ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-green-500" />
            <h3 className="font-medium text-gray-900 dark:text-white">Resource Quotas</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{metrics?.quotas?.length ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-purple-500" />
            <h3 className="font-medium text-gray-900 dark:text-white">Isolation Level</h3>
          </div>
          <p className="text-lg font-semibold text-purple-600">Row-Level + Rate-Limited</p>
        </div>
      </div>

      {metrics?.quotas && metrics.quotas.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white">Resource Quotas</h4>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">Resource</th>
                <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">Max Queries</th>
                <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">Max Export Rows</th>
                <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">Rate/min</th>
                <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">Priority</th>
              </tr>
            </thead>
            <tbody>
              {metrics.quotas.map((q, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-700/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{q.resourceType}</td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{q.maxConcurrentQueries}</td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{q.maxRowsPerExport.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{q.rateLimitPerMinute}</td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{q.priorityWeight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
        <h4 className="font-medium text-indigo-800 dark:text-indigo-300 mb-2">How Noisy Neighbor Isolation Works</h4>
        <ul className="text-sm text-indigo-700 dark:text-indigo-400 space-y-1">
          <li>&#8226; Each society has a concurrent query semaphore (default: 5)</li>
          <li>&#8226; Token-bucket rate limiting prevents burst overload (60 req/min)</li>
          <li>&#8226; Export queries are capped per tenant (50K rows max)</li>
          <li>&#8226; Priority-weighted scheduling ensures small societies keep low latency</li>
          <li>&#8226; Audit exports and notice blasts run in background queues</li>
        </ul>
      </div>
    </div>
  );
}

// ── Role Switching Panel ────────────────────────────────────────────────────

function RoleSwitchingPanel() {
  const { user, refreshUser } = useAuth();
  const [societies, setSocieties] = useState<UserSocietyRoleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    loadSocieties();
  }, []);

  async function loadSocieties() {
    setLoading(true);
    try {
      const data = await societyErpService.getMySocieties();
      setSocieties(Array.isArray(data) ? data : []);
    } catch { setSocieties([]); }
    setLoading(false);
  }

  async function handleSwitch(communityId: number, roleType: string) {
    setSwitching(true);
    try {
      const result = await societyErpService.switchSociety(communityId, roleType);
      if (result.switched && refreshUser) {
        await refreshUser();
      }
      await loadSocieties();
    } catch (e: any) {
      alert(e.message || "Switch failed");
    }
    setSwitching(false);
  }

  const roleIcons: Record<string, React.ReactNode> = {
    OWNER: <Lock className="w-4 h-4 text-blue-500" />,
    TENANT: <Unlock className="w-4 h-4 text-green-500" />,
    MC_TREASURER: <BarChart3 className="w-4 h-4 text-purple-500" />,
    MC_SECRETARY: <FileText className="w-4 h-4 text-orange-500" />,
    MC_PRESIDENT: <Shield className="w-4 h-4 text-red-500" />,
    ADMIN: <Shield className="w-4 h-4 text-indigo-500" />,
    MEMBER: <Users className="w-4 h-4 text-gray-500" />,
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading your societies...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">RBAC Role Switching</h2>
        <button onClick={loadSocieties} className="p-2 text-gray-500 hover:text-gray-700">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Current:</strong> {user?.communityName || "No society selected"} &mdash; {user?.role || "No role"}
          {user?.flatNo && ` (Flat ${user.flatNo})`}
        </p>
      </div>

      {societies.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No society roles found. Contact your admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {societies.map((s) => (
            <div key={s.societyRoleId}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 ${
                s.isPrimary
                  ? "border-indigo-300 dark:border-indigo-600 ring-1 ring-indigo-200 dark:ring-indigo-700"
                  : "border-gray-200 dark:border-gray-700"
              }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{s.communityName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.communityType}</p>
                  </div>
                </div>
                {s.isPrimary && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    Active
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                {roleIcons[s.roleType] || <Users className="w-4 h-4 text-gray-400" />}
                <span className="font-medium">{s.roleType.replace(/_/g, " ")}</span>
                {s.flatNo && <span className="text-gray-500">| Flat {s.flatNo}</span>}
              </div>
              {!s.isPrimary && (
                <button
                  onClick={() => handleSwitch(s.communityId, s.roleType)}
                  disabled={switching}
                  className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium w-full justify-center"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  {switching ? "Switching..." : "Switch to This"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
        <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">How RBAC Role Switching Works</h4>
        <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
          <li>&#8226; A user can be an Owner in Society A, a Tenant in Society B, and an MC Treasurer in Society A simultaneously</li>
          <li>&#8226; Switching instantly updates the authorization token with new permissions</li>
          <li>&#8226; Permissions are leak-proof: each society context is fully isolated</li>
          <li>&#8226; The JWT carries the active community_id and role_type for every API call</li>
        </ul>
      </div>
    </div>
  );
}

// ── Shared Components ───────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function FormField({ label, type, value, onChange }: {
  label: string; type: string; value: string | number;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
    </div>
  );
}
