import { useState, useEffect } from "react";
import {
  Boxes, CheckCircle, Clock, AlertTriangle,
  RefreshCw, History, ArrowDownRight, ArrowUpRight, FileText
} from "lucide-react";
import { vendorCommerceService } from "../../../../services/vendor/vendorCommerceService";
import type {
  VendorCommerceStats,
  InventoryBatchDto
} from "../../../../services/vendor/vendorCommerceService";
import { stockService, type StockLedgerReport } from "../../../../services/inventory/stockService";

export function VendorInventoryLedger() {
  const [activeTab, setActiveTab] = useState<"ledger" | "batches">("ledger");
  const [stats, setStats] = useState<VendorCommerceStats | null>(null);
  const [batches, setBatches] = useState<InventoryBatchDto[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, b, l] = await Promise.all([
        vendorCommerceService.getStats().catch(() => null),
        vendorCommerceService.getBatches().catch(() => []),
        stockService.getStockLedger().catch(() => []),
      ]);
      setStats(s);
      setBatches(b);
      setLedgerEntries(l);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-600" />
            Inventory Ledger & Stock Locking
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Authoritative double-entry movement ledger, pessimistic lock enforcement, and batch tracking.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Ledger
        </button>
      </div>

      {/* Stock Health Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Available Stock</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats?.totalAvailableStock ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Ready for immediate checkout</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Reserved Stock</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats?.totalReservedStock ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Held in active member checkouts</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Committed (Deals)</span>
            <Boxes className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600">{stats?.totalCommittedStock ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Locked for unlocked Group Deals</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expiry / Low Warnings</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{stats?.expiringBatchesCount ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Batches requiring liquidation</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-3">
        <button
          onClick={() => setActiveTab("ledger")}
          className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === "ledger"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          Authoritative Stock Ledger ({ledgerEntries.length})
        </button>
        <button
          onClick={() => setActiveTab("batches")}
          className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === "batches"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="w-4 h-4" />
          Batch Tracking & FEFO ({batches.length})
        </button>
      </div>

      {/* Authoritative Stock Ledger Table */}
      {activeTab === "ledger" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Immutable Double-Entry Stock Movement History
            </h3>
            <span className="text-xs text-slate-400 font-medium">Strict Non-Negative Check Enforced</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3.5 pl-4">Timestamp</th>
                  <th className="p-3.5">Reference / Doc</th>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Movement Type</th>
                  <th className="p-3.5 text-center">Change</th>
                  <th className="p-3.5 text-center">Resulting Balance</th>
                  <th className="p-3.5 text-right pr-4">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No stock movement entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((entry) => {
                    const isPositive = Number(entry.quantityChange) > 0;
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors font-medium text-slate-700">
                        <td className="p-3.5 pl-4 text-slate-500 font-mono text-[11px]">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          {entry.referenceType || "MANUAL"} {entry.referenceId ? `#${entry.referenceId}` : ""}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{entry.productName}</div>
                          {entry.sku && <div className="text-[10px] text-slate-400">SKU: {entry.sku}</div>}
                        </td>
                        <td className="p-3.5 text-slate-600">{entry.locationName}</td>
                        <td className="p-3.5">
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {entry.movementType || "TRANSFER"}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold">
                          <span className={`inline-flex items-center gap-1 font-black ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {isPositive ? `+${entry.quantityChange}` : entry.quantityChange}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-black text-indigo-600">{entry.resultingBalance}</td>
                        <td className="p-3.5 text-right pr-4 font-bold text-slate-900">
                          ₹{Number(entry.totalValue || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Batches Table */}
      {activeTab === "batches" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Batch Tracking & Expiry Dates
            </h3>
            <span className="text-xs text-slate-400 font-medium">FEFO Enforcement</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3.5 pl-4">Batch No</th>
                  <th className="p-3.5">Product & Variant</th>
                  <th className="p-3.5">Mfg Date</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5 text-center">Initial Qty</th>
                  <th className="p-3.5 text-center">Remaining</th>
                  <th className="p-3.5">Unit Cost</th>
                  <th className="p-3.5 text-right pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No inventory batches currently logged.
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => {
                    const isExpiring = batch.status === 'EXPIRING_SOON' || (batch.expiryDate && new Date(batch.expiryDate).getTime() - Date.now() < 7 * 24 * 3600 * 1000);
                    return (
                      <tr key={batch.id} className="hover:bg-slate-50/60 transition-colors font-medium text-slate-700">
                        <td className="p-3.5 pl-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                          {batch.batchNumber}
                          {isExpiring && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              FEFO
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{batch.productName}</div>
                          <div className="text-[10px] text-slate-400">{batch.variantName}</div>
                        </td>
                        <td className="p-3.5 text-slate-500">{batch.mfgDate}</td>
                        <td className="p-3.5">
                          <span className={isExpiring ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-slate-600'}>
                            {batch.expiryDate}
                            {isExpiring && <AlertTriangle className="w-3 h-3 text-rose-500 inline" />}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-500">{batch.initialQuantity}</td>
                        <td className="p-3.5 text-center font-black text-indigo-600">{batch.remainingQuantity}</td>
                        <td className="p-3.5 font-bold">₹{batch.unitCost}</td>
                        <td className="p-3.5 text-right pr-4">
                          <span className={"inline-block text-[10px] font-bold px-2 py-0.5 rounded-md " +
                            (batch.status === 'ACTIVE' && !isExpiring
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200')}>
                            {isExpiring ? 'EXPIRING SOON' : batch.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

