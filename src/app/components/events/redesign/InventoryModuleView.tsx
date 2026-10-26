import React, { useState, useEffect } from "react";
import { Plus, CheckCircle2, Sparkles, RefreshCw, X, Box } from "lucide-react";
import { GlassCard, StatusChip } from "./EventDesignSystem";
import { assetService, type Asset } from "../../../../services/inventory/assetService";
import { toast } from "sonner";

interface InventoryModuleViewProps {
  isDark?: boolean;
}

export const InventoryModuleView: React.FC<InventoryModuleViewProps> = ({ isDark = false }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [eventName, setEventName] = useState("");
  const [borrowDuration, setBorrowDuration] = useState("4 Hours");

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await assetService.getAssets();
      setAssets(data);
    } catch {
      toast.error("Failed to load community assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      const updated = await assetService.checkoutAsset(
        selectedAsset.id,
        `Event: ${eventName || "Community Function"}`,
        "Event Operations",
        borrowDuration
      );
      if (updated) {
        toast.success(`Successfully reserved ${selectedAsset.name} for ${eventName || "event"}!`);
        setIsReserveModalOpen(false);
        setSelectedAsset(null);
        setEventName("");
        loadAssets();
      }
    } catch {
      toast.error("Failed to allocate asset for event.");
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Operations Inventory
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Equipment & Assets</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAssets}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            title="Refresh Assets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading equipment assets...</div>
      ) : assets.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Box className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No assets found</p>
          <p className="text-xs text-slate-400 mt-1">Add items to the community asset ledger to allocate them for events.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assets.map((item) => {
            const isAvailable = item.status === "AVAILABLE";
            return (
              <GlassCard key={item.id} isDark={isDark} hoverScale={false} className="p-4 border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{item.category}</span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.borrowedBy ? `Assigned to: ${item.borrowedBy}` : "Available for checkout"}
                    </p>
                  </div>
                  <StatusChip status={item.status} isDark={isDark} />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">TCO: ₹{item.tco || 0}</span>
                  {isAvailable ? (
                    <button
                      onClick={() => {
                        setSelectedAsset(item);
                        setIsReserveModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#FF6B00] text-white text-[11px] font-bold hover:opacity-90 cursor-pointer"
                    >
                      Allocate to Event
                    </button>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">
                      In Use
                    </span>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Allocation / Reservation Modal */}
      {isReserveModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Allocate Equipment</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedAsset.name}</p>
              </div>
              <button
                onClick={() => setIsReserveModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReserve} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Cultural Night"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium dark:bg-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Required Duration
                </label>
                <select
                  value={borrowDuration}
                  onChange={(e) => setBorrowDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium dark:bg-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                >
                  <option value="2 Hours">2 Hours</option>
                  <option value="4 Hours">4 Hours</option>
                  <option value="Full Day (8 Hours)">Full Day (8 Hours)</option>
                  <option value="2 Days">2 Days</option>
                  <option value="Custom Duration">Custom Duration</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReserveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6B00] text-white hover:opacity-90 shadow-md shadow-[#FF6B00]/20 cursor-pointer"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
