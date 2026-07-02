import React, { useState, useEffect } from "react";
import { ClipboardList, Check, X, Plus, Search, Sparkles, IndianRupee, AlertCircle, Calendar, TrendingDown, Activity, User, ShieldAlert, Heart } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { assetAuditService, type AssetAuditLog } from "../../../services/assetAuditService";
import { assetService, type Asset } from "../../../services/assetService";

export function AssetAuditDashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AssetAuditLog[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"logs" | "audit" | "depreciation">("logs");
  const [submitting, setSubmitting] = useState(false);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");

  // Audit Form State
  const [auditForm, setAuditForm] = useState({
    assetId: "",
    auditedBy: user?.fullName || user?.email || "Admin Auditor",
    actualStatus: "AVAILABLE",
    expectedQuantity: 1,
    actualQuantity: 1,
    notes: ""
  });

  const fetchLogs = async () => {
    try {
      const data = await assetAuditService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audit logs");
    }
  };

  const fetchAssets = async () => {
    try {
      const rawAssets = await assetService.getAssets();
      // Fetch detailed asset objects if necessary, but base asset list is fine
      // Since mapAsset in assetService returns basic fields, let's load raw items for fields like originalCost/depreciationMethod
      // Actually rawAssets is retrieved from '/inventory/items', let's check its fields
      setAssets(rawAssets);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assets");
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchLogs(), fetchAssets()]).finally(() => setLoading(false));
  }, []);

  // Set initial expected quantity when asset changes in form
  const handleAssetChange = (assetId: string) => {
    const selectedAsset = assets.find(a => String(a.id) === assetId);
    setAuditForm(prev => ({
      ...prev,
      assetId,
      expectedQuantity: 1, // Standard asset tracking is 1 unit per serial number
      actualQuantity: 1,
      actualStatus: selectedAsset?.status || "AVAILABLE"
    }));
  };

  const handleRecordAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditForm.assetId) {
      toast.error("Please select an asset to audit");
      return;
    }

    setSubmitting(true);
    try {
      await assetAuditService.recordAudit(auditForm.assetId, {
        auditedBy: auditForm.auditedBy,
        actualStatus: auditForm.actualStatus,
        expectedQuantity: auditForm.expectedQuantity,
        actualQuantity: auditForm.actualQuantity,
        notes: auditForm.notes
      });
      
      toast.success("Physical asset audit recorded successfully");
      
      // Reset form
      setAuditForm({
        assetId: "",
        auditedBy: user?.fullName || user?.email || "Admin Auditor",
        actualStatus: "AVAILABLE",
        expectedQuantity: 1,
        actualQuantity: 1,
        notes: ""
      });

      // Refresh data
      Promise.all([fetchLogs(), fetchAssets()]);
      setActiveTab("logs");
    } catch (err) {
      console.error(err);
      toast.error("Failed to record asset audit");
    } finally {
      setSubmitting(false);
    }
  };

  // Depreciation Calculation Helper
  const calculateBookValue = (asset: any) => {
    if (!asset.originalCost) return 0;
    const cost = Number(asset.originalCost || asset.tco || 0);
    const salvage = Number(asset.salvageValue || 0);
    const lifeMonths = Number(asset.usefulLifeMonths || 60);
    const method = asset.depreciationMethod || "STRAIGHT_LINE";
    
    // Fallback if no purchase date
    if (!asset.purchaseDate) return cost;
    
    const purchase = new Date(asset.purchaseDate);
    const now = new Date();
    
    const elapsedMonths = (now.getFullYear() - purchase.getFullYear()) * 12 + (now.getMonth() - purchase.getMonth());
    if (elapsedMonths <= 0) return cost;
    if (elapsedMonths >= lifeMonths) return salvage;

    if (method === "STRAIGHT_LINE") {
      const monthlyDepr = (cost - salvage) / lifeMonths;
      const totalDepr = monthlyDepr * elapsedMonths;
      return Math.max(salvage, cost - totalDepr);
    } else {
      // Written Down Value (20% annual declining balance)
      const annualRate = 0.20;
      const elapsedYears = elapsedMonths / 12;
      const currentVal = cost * Math.pow(1 - annualRate, elapsedYears);
      return Math.max(salvage, currentVal);
    }
  };

  // Health Score Calculations (out of 100)
  const calculateHealthScore = (asset: any) => {
    // Health score drops with age, status, and variance
    let score = 100;
    
    if (asset.status === "MAINTENANCE") {
      score -= 30;
    } else if (asset.status === "LOST") {
      return 0;
    }

    if (asset.auditVariance && asset.auditVariance < 0) {
      score -= 40;
    }

    // Age deduction
    if (asset.purchaseDate && asset.usefulLifeMonths) {
      const purchase = new Date(asset.purchaseDate);
      const now = new Date();
      const elapsedMonths = (now.getFullYear() - purchase.getFullYear()) * 12 + (now.getMonth() - purchase.getMonth());
      const lifeFraction = Math.min(elapsedMonths / asset.usefulLifeMonths, 1);
      score -= Math.round(lifeFraction * 30); // max 30 points deduction for age
    }

    return Math.max(0, score);
  };

  const getHealthBadgeColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  // Aggregated KPI Stats
  const totalBookValue = assets.reduce((sum, a) => sum + calculateBookValue(a), 0);
  const totalOriginalCost = assets.reduce((sum, a) => sum + Number(a.originalCost || a.tco || 0), 0);
  const averageHealth = assets.length > 0 
    ? Math.round(assets.reduce((sum, a) => sum + calculateHealthScore(a), 0) / assets.length)
    : 100;
  const varianceCount = assets.filter(a => a.auditVariance && a.auditVariance < 0).length;

  const filteredLogs = logs.filter(log => {
    const assetName = log.asset?.name?.toLowerCase() || "";
    const auditor = log.auditedBy?.toLowerCase() || "";
    const notes = log.notes?.toLowerCase() || "";
    const matchesSearch = assetName.includes(searchTerm.toLowerCase()) || 
                          auditor.includes(searchTerm.toLowerCase()) ||
                          notes.includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Facility Management</span>
          <h1 className="text-3xl font-black text-[#0d0d2b] flex items-center gap-2 mt-1">
            <ClipboardList className="h-8 w-8 text-indigo-600" />
            Asset Audit & Depreciation
          </h1>
          <p className="text-[#6b7094] text-sm mt-1">
            Track asset health scores, calculate book value depreciation, and record physical inventory audits.
          </p>
        </div>

        <button
          onClick={() => setActiveTab("audit")}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white px-5 py-3 rounded-full font-bold transition-all text-sm md:self-end"
        >
          <Plus className="h-5 w-5" />
          Perform Physical Audit
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
          <div className="flex items-center gap-3 text-[#6b7094] text-xs font-semibold mb-2">
            <Heart className="h-4 w-4 text-emerald-500" />
            AVERAGE HEALTH SCORE
          </div>
          <div className="text-2xl font-black text-[#0d0d2b] flex items-baseline gap-1">
            {averageHealth}
            <span className="text-xs font-normal text-[#6b7094]">/100</span>
          </div>
        </div>

        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
          <div className="flex items-center gap-3 text-[#6b7094] text-xs font-semibold mb-2">
            <TrendingDown className="h-4 w-4 text-indigo-600" />
            NET BOOK VALUE
          </div>
          <div className="text-2xl font-black text-[#0d0d2b]">₹{Math.round(totalBookValue).toLocaleString("en-IN")}</div>
        </div>

        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
          <div className="flex items-center gap-3 text-[#6b7094] text-xs font-semibold mb-2">
            <IndianRupee className="h-4 w-4 text-[#6b7094]" />
            ACCUMULATED DEPRECIATION
          </div>
          <div className="text-2xl font-black text-[#0d0d2b]">
            ₹{Math.round(totalOriginalCost - totalBookValue).toLocaleString("en-IN")}
          </div>
        </div>

        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
          <div className="flex items-center gap-3 text-[#6b7094] text-xs font-semibold mb-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            VARIANCE CONCERNS
          </div>
          <div className="text-2xl font-black text-[#0d0d2b]">{varianceCount} <span className="text-xs font-normal text-[#6b7094]">items missing</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${
            activeTab === "logs" ? "border-indigo-500 text-[#0d0d2b]" : "border-transparent text-[#6b7094] hover:text-[#0d0d2b]"
          }`}
        >
          Audit History Logs
        </button>
        <button
          onClick={() => setActiveTab("depreciation")}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${
            activeTab === "depreciation" ? "border-indigo-500 text-[#0d0d2b]" : "border-transparent text-[#6b7094] hover:text-[#0d0d2b]"
          }`}
        >
          Depreciation & Book Value
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${
            activeTab === "audit" ? "border-indigo-500 text-[#0d0d2b]" : "border-transparent text-[#6b7094] hover:text-[#0d0d2b]"
          }`}
        >
          New Audit Worksheets
        </button>
      </div>

      {/* Main Content Areas */}
      {loading ? (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.03)] p-12 text-center text-[#6b7094]">
          Loading audit sheets...
        </div>
      ) : activeTab === "logs" ? (
        /* AUDIT LOGS TAB */
        <div>
          {/* Filters */}
          <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.03)] p-4 mb-6 flex items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7094]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs by asset or auditor..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.03)] p-12 text-center text-[#6b7094]">
              No historical audits recorded yet. Click "Perform Physical Audit" to start.
            </div>
          ) : (
            <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                      <th className="py-4 px-6">Asset Name</th>
                      <th className="py-4 px-6">Audit Date</th>
                      <th className="py-4 px-6">Auditor</th>
                      <th className="py-4 px-6">Quantity (Expected vs Actual)</th>
                      <th className="py-4 px-6">Variance</th>
                      <th className="py-4 px-6">Status Change</th>
                      <th className="py-4 px-6">Auditor Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-indigo-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-[#0d0d2b]">{log.asset?.name || "Unknown Asset"}</td>
                        <td className="py-4 px-6 text-[#6b7094]">
                          {log.auditedAt ? new Date(log.auditedAt).toLocaleString() : "—"}
                        </td>
                        <td className="py-4 px-6 text-[#374151]">{log.auditedBy}</td>
                        <td className="py-4 px-6 text-[#374151]">
                          {log.expectedQuantity} Units vs <span className="font-bold text-[#0d0d2b]">{log.actualQuantity} Units</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                            log.variance === 0 ? "text-[#6b7094] bg-slate-100" :
                            log.variance > 0 ? "text-emerald-600 bg-emerald-50" :
                            "text-red-600 bg-red-50"
                          }`}>
                            {log.variance > 0 ? `+${log.variance}` : log.variance}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-[#6b7094]">
                          {log.expectedStatus} → <span className="font-bold text-[#0d0d2b]">{log.actualStatus}</span>
                        </td>
                        <td className="py-4 px-6 text-[#6b7094] max-w-xs truncate">{log.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === "depreciation" ? (
        /* DEPRECIATION TAB */
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-[#6b7094] uppercase tracking-wider">
                  <th className="py-4 px-6">Asset Name</th>
                  <th className="py-4 px-6">Purchase Date</th>
                  <th className="py-4 px-6">Original Cost</th>
                  <th className="py-4 px-6">Useful Life</th>
                  <th className="py-4 px-6">Depreciation Method</th>
                  <th className="py-4 px-6">Current Value (Book Value)</th>
                  <th className="py-4 px-6">Depreciated Amount</th>
                  <th className="py-4 px-6">Asset Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {assets.map((asset) => {
                  const cost = Number(asset.originalCost || asset.tco || 0);
                  const bookVal = calculateBookValue(asset);
                  const deprVal = cost - bookVal;
                  const healthScore = calculateHealthScore(asset);
                  return (
                    <tr key={asset.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-[#0d0d2b]">
                        {asset.name}
                        <span className="block text-[10px] font-normal text-[#6b7094] uppercase mt-0.5">{asset.category}</span>
                      </td>
                      <td className="py-4 px-6 text-[#6b7094]">{asset.purchaseDate || "N/A"}</td>
                      <td className="py-4 px-6 text-[#374151]">₹{cost.toLocaleString("en-IN")}</td>
                      <td className="py-4 px-6 text-[#374151]">
                        {asset.usefulLifeMonths ? `${asset.usefulLifeMonths} Months` : "60 Months"}
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-[#6b7094]">
                        {asset.depreciationMethod === "WRITTEN_DOWN_VALUE" ? "Written Down Value (20%)" : "Straight Line"}
                      </td>
                      <td className="py-4 px-6 font-black text-indigo-600">₹{Math.round(bookVal).toLocaleString("en-IN")}</td>
                      <td className="py-4 px-6 text-red-600/90 font-medium">
                        -₹{Math.round(deprVal).toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold uppercase ${getHealthBadgeColor(healthScore)}`}>
                          {healthScore}% {healthScore >= 80 ? "Excellent" : healthScore >= 50 ? "Fair" : "Poor"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* NEW AUDIT FORM TAB */
        <div className="max-w-2xl bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-6 md:p-8 mx-auto animate-fade-in">
          <h2 className="text-xl font-black text-[#0d0d2b] flex items-center gap-2 mb-6">
            <Activity className="h-6 w-6 text-indigo-600" />
            Physical Inventory Audit Form
          </h2>

          <form onSubmit={handleRecordAudit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-2">Select Target Asset</label>
              <select
                value={auditForm.assetId}
                onChange={(e) => handleAssetChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                required
              >
                <option value="">-- Select Asset --</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name} (Current Status: {asset.status})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-2">Expected Quantity</label>
                <input
                  type="number"
                  value={auditForm.expectedQuantity}
                  onChange={(e) => setAuditForm({ ...auditForm, expectedQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-2">Actual Physical Quantity</label>
                <input
                  type="number"
                  value={auditForm.actualQuantity}
                  onChange={(e) => setAuditForm({ ...auditForm, actualQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-2">Physical Condition / Status</label>
                <select
                  value={auditForm.actualStatus}
                  onChange={(e) => setAuditForm({ ...auditForm, actualStatus: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  required
                >
                  <option value="AVAILABLE">Available / Working</option>
                  <option value="BORROWED">Borrowed / In Use</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                  <option value="LOST">Lost / Missing</option>
                  <option value="DISPOSED">Scrapped / Disposed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-2">Auditor Name</label>
                <input
                  type="text"
                  value={auditForm.auditedBy}
                  onChange={(e) => setAuditForm({ ...auditForm, auditedBy: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7094] mb-2">Discrepancy Notes / Remarks</label>
              <textarea
                value={auditForm.notes}
                onChange={(e) => setAuditForm({ ...auditForm, notes: e.target.value })}
                placeholder="Log physical condition, missing parts, serial mismatches or verification details..."
                rows={3}
                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all"
              >
                {submitting ? "Saving Audit Sheet..." : "Record Physical Audit"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("logs")}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-[#6b7094] font-bold py-3 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
