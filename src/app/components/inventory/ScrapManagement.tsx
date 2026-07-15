import { useState, useEffect } from "react";
import { 
  Archive, AlertTriangle, Plus, Search, Calendar, 
  Trash2, User, Check, Play, FileText, Landmark
} from "lucide-react";
import { stockService } from "../../../services/stockService";
import type { Product, Location, Lot, ScrapRecord } from "../../../services/stockService";
import { toast } from "sonner";

interface ScrapManagementProps {
  products: Product[];
  locations: Location[];
  onScrapSuccess: () => void;
}

export function ScrapManagement({ products, locations, onScrapSuccess }: ScrapManagementProps) {
  const [scrapRecords, setScrapRecords] = useState<ScrapRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form states
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedLotId, setSelectedLotId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  
  // Dynamic lot list
  const [lots, setLots] = useState<Lot[]>([]);
  const [lotsLoading, setLotsLoading] = useState(false);

  // Filters
  const internalLocations = locations.filter(l => l.usage === "INTERNAL");
  const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));
  const requiresLot = selectedProduct && selectedProduct.tracking && selectedProduct.tracking !== "NONE";

  const loadScraps = async () => {
    setLoading(true);
    try {
      const data = await stockService.getAllScraps();
      setScrapRecords(data);
    } catch (err: any) {
      toast.error("Failed to load scrap records history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScraps();
  }, []);

  // Fetch lots dynamically when selected product changes
  useEffect(() => {
    if (requiresLot && selectedProductId) {
      setLotsLoading(true);
      stockService.getLotsByProduct(parseInt(selectedProductId))
        .then(data => {
          setLots(data);
          setSelectedLotId(""); // Reset selection
        })
        .catch(() => {
          toast.error("Failed to load lots for selected product");
        })
        .finally(() => {
          setLotsLoading(false);
        });
    } else {
      setLots([]);
      setSelectedLotId("");
    }
  }, [selectedProductId, requiresLot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedLocationId || quantity <= 0) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (requiresLot && !selectedLotId) {
      toast.error("This product requires a Lot or Serial selection.");
      return;
    }

    try {
      const payload = {
        productId: parseInt(selectedProductId),
        locationId: parseInt(selectedLocationId),
        lotId: selectedLotId ? parseInt(selectedLotId) : undefined,
        quantity: quantity,
        reason: reason
      };

      if (saveAsDraft) {
        await stockService.createDraftScrap(payload);
        toast.success("Draft scrap record created successfully!");
      } else {
        await stockService.quickScrap(payload);
        toast.success("Stock scrapped and ledger adjusted successfully!");
      }

      // Reset form
      setSelectedProductId("");
      setSelectedLocationId("");
      setSelectedLotId("");
      setQuantity(1);
      setReason("");
      
      // Reload lists
      loadScraps();
      onScrapSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to process scrap adjustment");
    }
  };

  const handleConfirmDraft = async (scrapId: number) => {
    try {
      await stockService.confirmScrap(scrapId);
      toast.success("Scrap transfer validated. Inventory updated!");
      loadScraps();
      onScrapSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm scrap record");
    }
  };

  const filteredRecords = scrapRecords.filter(rec => 
    (rec.productName && rec.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rec.reason && rec.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rec.lotName && rec.lotName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Archive className="w-5 h-5 text-rose-600" />
          Scrap & Waste Management
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Perform scrap operations to discard broken, defective, or unusable stock. Supports draft creation, lot-level details, and full double-entry auditing.
        </p>
      </div>

      {/* FORM AND STATS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SCRAP FORM CARD */}
        <div className="lg:col-span-2 bg-white border border-slate-150 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-rose-500" />
            Record Scrap Adjustment
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Source Location */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Source Location <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="">-- Choose Location --</option>
                  {internalLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.completeName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Lot / Serial Selector (Conditional) */}
              {requiresLot ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                    Lot / Serial Number <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedLotId}
                    onChange={(e) => setSelectedLotId(e.target.value)}
                    disabled={lotsLoading || lots.length === 0}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white text-slate-700 appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    {lotsLoading ? (
                      <option>Loading tracking numbers...</option>
                    ) : lots.length === 0 ? (
                      <option value="">No lots available for this product</option>
                    ) : (
                      <>
                        <option value="">-- Select Lot/Serial --</option>
                        {lots.map(lot => (
                          <option key={lot.id} value={lot.id}>{lot.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              ) : selectedProductId ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                    Lot / Serial Number
                  </label>
                  <div className="w-full px-3 py-2 border border-dashed border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-400 italic">
                    Product tracking is disabled (NONE)
                  </div>
                </div>
              ) : null}

              {/* Quantity */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white text-slate-700"
                />
              </div>
            </div>

            {/* Scrap Reason */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Reason / Remarks
              </label>
              <textarea
                placeholder="e.g. Broken packaging, expired shelf life, physical defect during quality check..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white text-slate-700 resize-none"
              />
            </div>

            {/* Save Type Gating */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAsDraft}
                  onChange={(e) => setSaveAsDraft(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-600">
                  Save as Draft (validate/confirm later)
                </span>
              </label>

              <button
                type="submit"
                className={`px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-md border-none cursor-pointer transition-all ${
                  saveAsDraft 
                    ? "bg-slate-700 hover:bg-slate-800" 
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {saveAsDraft ? "Create Draft Scrap" : "Scrap Stock Immediately"}
              </button>
            </div>
          </form>
        </div>

        {/* DOUBLE ENTRY SCRAP EXPLANATION */}
        <div className="bg-rose-50/50 border border-rose-100/60 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
              <Landmark className="w-4 h-4" />
              Double-Entry Audits
            </h4>
            <p className="text-xs text-rose-700/80 leading-relaxed">
              Every scrap operation triggers a real inventory move. The source location is debited (subtracted), and a virtual **Scrap Location** is credited (added). 
            </p>
            <p className="text-xs text-rose-700/80 leading-relaxed">
              This permanent ledger records quantities, expiration, lot batches, reasons, and responsible operators, maintaining strict inventory alignment.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-rose-100 flex items-center gap-2 text-rose-800">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 animate-bounce" />
            <span className="text-[10px] font-bold">WARNING: Action is permanent once validated.</span>
          </div>
        </div>
      </div>

      {/* SCRAP AUDIT LOG LIST */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Scrap Audit History
            </h3>
            <p className="text-[11px] text-slate-400">
              Audit log of all processed waste and draft disposal requests.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white text-slate-700"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <div className="w-6 h-6 border-2 border-t-transparent border-rose-500 rounded-full animate-spin mx-auto mb-3"></div>
              Loading scrap history logs...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 italic">
              No scrap records registered.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3 text-xs font-bold text-slate-600">Product</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-600">Lot / Serial</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-600">From Location</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-600">Scrap Location</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-600">Quantity</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-600">Status</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-600">Scrapped By</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-600">Date</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-xs font-semibold text-slate-700">
                        {rec.productName}
                      </td>
                      <td className="px-5 py-3">
                        {rec.lotName ? (
                          <span className="font-mono text-[10px] font-bold text-[#017e84] bg-[#017e84]/5 px-1.5 py-0.5 rounded border border-[#017e84]/15">
                            {rec.lotName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {rec.sourceLocationName}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {rec.scrapLocationName}
                      </td>
                      <td className="px-5 py-3 text-xs font-bold text-rose-600">
                        {rec.quantity}
                      </td>
                      <td className="px-5 py-3">
                        {rec.state === "DRAFT" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                            DRAFT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            DONE
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        {rec.scrappedByName ? (
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {rec.scrappedByName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {rec.scrappedAt 
                          ? new Date(rec.scrappedAt).toLocaleString() 
                          : new Date(rec.createdAt || "").toLocaleDateString()
                        }
                      </td>
                      <td className="px-5 py-3 text-right">
                        {rec.state === "DRAFT" ? (
                          <button
                            onClick={() => handleConfirmDraft(rec.id!)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded shadow-xs border-none cursor-pointer transition-all"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Validate
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-medium flex items-center justify-end gap-1 select-none">
                            <Check className="w-3.5 h-3.5 text-emerald-500" /> Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
