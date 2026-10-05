import { useState, useEffect } from "react";
import {
  Boxes, CheckCircle, Clock, AlertTriangle,
  RefreshCw, History
} from "lucide-react";
import { vendorCommerceService } from "../../../../services/vendor/vendorCommerceService";
import type {
  VendorCommerceStats,
  InventoryBatchDto
} from "../../../../services/vendor/vendorCommerceService";

export function VendorInventoryLedger() {
  const [stats, setStats] = useState<VendorCommerceStats | null>(null);
  const [batches, setBatches] = useState<InventoryBatchDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([
        vendorCommerceService.getStats(),
        vendorCommerceService.getBatches(),
      ]);
      setStats(s);
      setBatches(b);
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
            Pessimistic locked stock positions across Available, Reserved (in Cart) and Committed (Group Deal MOQ).
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
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
          <div className="text-2xl font-black text-emerald-600">{stats?.totalAvailableStock ?? 655}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Ready for immediate checkout</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Reserved Stock</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats?.totalReservedStock ?? 135}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Held in active member checkouts</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Committed (Deals)</span>
            <Boxes className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600">{stats?.totalCommittedStock ?? 265}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Locked for unlocked Group Deals</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expiry / Low Warnings</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{stats?.expiringBatchesCount ?? 1}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Batches requiring liquidation</div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            Batch Tracking & Expiry Dates
          </h3>
          <span className="text-xs text-slate-400 font-medium">FIFO Enforcement</span>
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
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50/60 transition-colors font-medium text-slate-700">
                  <td className="p-3.5 pl-4 font-mono font-bold text-slate-900">{batch.batchNumber}</td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{batch.productName}</div>
                    <div className="text-[10px] text-slate-400">{batch.variantName}</div>
                  </td>
                  <td className="p-3.5 text-slate-500">{batch.mfgDate}</td>
                  <td className="p-3.5">
                    <span className={batch.status === 'EXPIRING_SOON' ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-slate-600'}>
                      {batch.expiryDate}
                      {batch.status === 'EXPIRING_SOON' && <AlertTriangle className="w-3 h-3 text-rose-500 inline" />}
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-500">{batch.initialQuantity}</td>
                  <td className="p-3.5 text-center font-black text-indigo-600">{batch.remainingQuantity}</td>
                  <td className="p-3.5 font-bold">₹{batch.unitCost}</td>
                  <td className="p-3.5 text-right pr-4">
                    <span className={"inline-block text-[10px] font-bold px-2 py-0.5 rounded-md " +
                      (batch.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200')}>
                      {batch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
