import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Package, QrCode, ClipboardCheck } from "lucide-react";
import { assetService } from "../../../services/assetService";
import type { Asset } from "../../../services/assetService";
import { ExpenseUpload } from "../assets/ExpenseUpload";
import { TreasurerQueue } from "../assets/TreasurerQueue";
import { DoubleEntryInventory } from "./DoubleEntryInventory";
import { toast, Toaster } from "sonner";

export function InventoryDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subView = (searchParams.get("tab") as "stock-ledger" | "assets" | "upload" | "approve") || "stock-ledger";

  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [duration, setDuration] = useState("3 Hours");
  const [customDuration, setCustomDuration] = useState("");

  const refreshAssets = async () => {
    try {
      const data = await assetService.getAssets();
      setAssets(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (subView === "assets") {
      refreshAssets();
    }
  }, [subView]);

  const setSubView = (tab: "stock-ledger" | "assets" | "upload" | "approve") => {
    setSearchParams({ tab });
  };

  const handleReturn = async (assetId: string) => {
    const updated = await assetService.checkinAsset(assetId);
    if (updated) {
      toast.success(`${updated.name} returned successfully!`);
      refreshAssets();
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    const finalDuration = duration === "Custom" ? customDuration || "Custom Time" : duration;
    const updated = await assetService.checkoutAsset(selectedAsset.id, "Admin Staff", "Management Office", finalDuration);
    if (updated) {
      toast.success(`${updated.name} checked out successfully!`);
      setSelectedAsset(null);
      refreshAssets();
    }
  };

  const getCategoryAvatar = (category: string, name: string) => {
    const n = name.toLowerCase();
    const c = category.toLowerCase();
    if (n.includes("lawnmower") || n.includes("lawn") || n.includes("grass") || c.includes("garden")) return "🌾";
    if (n.includes("drill") || n.includes("hammer") || n.includes("saw") || c.includes("tool")) return "🛠️";
    if (n.includes("ladder") || n.includes("step")) return "🪜";
    if (n.includes("ps5") || n.includes("xbox") || n.includes("playstation") || n.includes("console") || c.includes("electronic")) return "🎮";
    if (n.includes("cricket") || n.includes("bat") || n.includes("ball") || n.includes("kit") || c.includes("sport")) return "🏏";
    if (n.includes("vacuum") || n.includes("clean") || c.includes("clean")) return "🧹";
    return "📦";
  };

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="mb-6">
        <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Facility Management</span>
        <h1 className="text-2xl font-black text-[#0d0d2b] flex items-center gap-2 mt-0.5">
          <Package className="h-7 w-7 text-indigo-600" />
          Inventory Management
        </h1>
        <p className="text-[#6b7094] text-xs mt-1">Manage physical community assets, warehouse operations, and double-entry stock transactions.</p>
      </div>

      {/* Sub views */}
      {subView === "stock-ledger" && (
        <DoubleEntryInventory />
      )}

      {subView === "assets" && (
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Dashboard Summary Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <div>
              <h3 className="text-sm font-extrabold text-[#0d0d2b]">Community Assets Pool</h3>
              <p className="text-xs text-[#6b7094] mt-0.5">Physical items available for checkout by residents</p>
            </div>
            <span className="text-xs text-indigo-600 font-bold bg-indigo-50 border border-indigo-200/50 px-4 py-2 rounded-xl self-start sm:self-auto">
              {assets.length} Registered Items
            </span>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <div 
                key={asset.id} 
                className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5 flex flex-col justify-between hover:border-indigo-500/20 hover:shadow-md transition-all duration-300 group"
              >
                <div className="space-y-4">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#6b7094] font-semibold tracking-wider">ASSET ID: #{asset.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                      asset.status === "AVAILABLE" 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                        : "bg-yellow-50 text-yellow-600 border-yellow-200"
                    }`}>
                      {asset.status}
                    </span>
                  </div>

                  {/* Icon & Category */}
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-gradient-to-tr from-indigo-50 to-violet-50 border border-indigo-100/50 rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-all">
                      {getCategoryAvatar(asset.category, asset.name)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0d0d2b] leading-tight group-hover:text-indigo-600 transition-colors">
                        {asset.name}
                      </h4>
                      <p className="text-xs text-[#6b7094] mt-1 font-bold uppercase tracking-wider text-[10px]">
                        {asset.category.split("_")[1] || asset.category}
                      </p>
                    </div>
                  </div>

                  {/* Active Borrower Info */}
                  {asset.status === "BORROWED" && (
                    <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl text-xs space-y-1.5 text-[#6b7094]">
                      <div className="flex justify-between">
                        <span>Borrower:</span>
                        <span className="font-bold text-[#0d0d2b]">{asset.borrowedBy} ({asset.borrowedByFlat})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Return:</span>
                        <span className="font-bold text-[#0d0d2b]">{asset.expectedReturn}</span>
                      </div>
                    </div>
                  )}

                  {/* Cost Indicator */}
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                    <span className="text-[#6b7094]">Asset Lifecycle Cost (TCO):</span>
                    <span className="font-black text-indigo-600 text-sm">₹{asset.tco.toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => window.open(`/items/${asset.id}`, "_blank")}
                    className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#374151] rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#6b7094]" />
                    Scan Link
                  </button>
                  {asset.status === "BORROWED" ? (
                    <button
                      onClick={() => handleReturn(asset.id)}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      Return Item
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setDuration("3 Hours");
                        setCustomDuration("");
                        setSelectedAsset(asset);
                      }}
                      className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border-none"
                    >
                      Check Out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subView === "upload" && (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-6 max-w-lg mx-auto">
          <ExpenseUpload isNested onSubmitSuccess={() => setSubView("assets")} />
        </div>
      )}

      {subView === "approve" && (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden min-h-[480px] flex max-w-7xl mx-auto">
          <TreasurerQueue isNested />
        </div>
      )}

      {/* Checkout Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedAsset(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0d0d2b]">Manual Checkout: {selectedAsset.name}</h3>
              <button onClick={() => setSelectedAsset(null)} className="text-[#6b7094] hover:text-[#0d0d2b]">✕</button>
            </div>
            
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#6b7094] block mb-2">Expected Return Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="3 Hours">3 Hours</option>
                  <option value="1 Day">1 Day</option>
                  <option value="Custom">Custom Duration</option>
                </select>
                {duration === "Custom" && (
                  <input
                    type="text"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    placeholder="e.g. 5 Hours, 2 Days"
                    className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
                    required
                  />
                )}
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all cursor-pointer border-none">
                Confirm Checkout
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
