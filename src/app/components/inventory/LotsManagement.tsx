import { useState, useEffect } from "react";
import { 
  Plus, Search, Tags, Calendar, FileText, AlertTriangle, 
  Trash2, Filter, PackageOpen, ChevronRight, X
} from "lucide-react";
import { stockService } from "../../../services/stockService";
import type { Product, Lot } from "../../../services/stockService";
import { toast } from "sonner";

interface LotsManagementProps {
  products: Product[];
}

export function LotsManagement({ products }: LotsManagementProps) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    productId: "",
    expirationDate: "",
    notes: ""
  });
  
  // Filter products that require tracking
  const trackedProducts = products.filter(p => p.tracking && p.tracking !== "NONE");

  const loadLots = async () => {
    setLoading(true);
    try {
      if (selectedProductId !== "all") {
        const data = await stockService.getLotsByProduct(parseInt(selectedProductId));
        setLots(data);
      } else {
        // If "all" is selected, we fetch lots for each tracked product and merge them
        const allLotsPromises = trackedProducts.map(p => 
          stockService.getLotsByProduct(p.id!).catch(() => [] as Lot[])
        );
        const results = await Promise.all(allLotsPromises);
        const merged = results.flat().sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setLots(merged);
      }
    } catch (err: any) {
      toast.error("Failed to load lot/serial numbers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLots();
  }, [selectedProductId, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.productId) {
      toast.error("Please provide a name and select a product.");
      return;
    }

    try {
      const payload = {
        name: form.name,
        productId: parseInt(form.productId),
        expirationDate: form.expirationDate || undefined,
        notes: form.notes || undefined
      };
      await stockService.createLot(payload);
      toast.success("Lot/Serial number registered successfully!");
      setIsModalOpen(false);
      setForm({ name: "", productId: "", expirationDate: "", notes: "" });
      loadLots();
    } catch (err: any) {
      toast.error(err.message || "Failed to register lot/serial");
    }
  };

  const filteredLots = lots.filter(lot => 
    lot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lot.productName && lot.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTrackingBadge = (prodId: number) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return null;
    
    if (prod.tracking === "SERIAL") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-600 border border-cyan-200">
          SERIAL
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-200">
        LOT
      </span>
    );
  };

  const isExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr).getTime() < new Date().getTime();
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Tags className="w-5 h-5 text-[#017e84]" />
            Lots & Serials Registry
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage batches, track expiration details, and assign unique serial identifiers to inventory products.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#017e84] hover:bg-[#01666b] text-white text-xs font-bold rounded-lg shadow-sm transition-all border-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Register Lot/Serial
        </button>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search lot or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#017e84]/20 focus:border-[#017e84] bg-white text-slate-700"
          />
        </div>

        {/* Product Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#017e84]/20 focus:border-[#017e84] bg-white text-slate-700 appearance-none cursor-pointer"
          >
            <option value="all">All Tracked Products</option>
            {trackedProducts.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.tracking})</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-t-transparent border-[#017e84] rounded-full animate-spin mx-auto mb-3"></div>
            Fetching registered records...
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="py-16 text-center">
            <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No Lots or Serials Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              There are no registered tracking codes matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 text-xs font-bold text-slate-600">Lot/Serial Reference</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-600">Product</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-600">Type</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-600">Expiration Date</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-600">Notes</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-600">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLots.map((lot) => {
                  const expired = isExpired(lot.expirationDate);
                  return (
                    <tr key={lot.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-bold text-[#017e84] bg-[#017e84]/5 px-2 py-1 rounded">
                          {lot.name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                        {lot.productName || "Product #" + lot.productId}
                      </td>
                      <td className="px-5 py-3.5">
                        {getTrackingBadge(lot.productId)}
                      </td>
                      <td className="px-5 py-3.5">
                        {lot.expirationDate ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                            expired 
                              ? "bg-red-50 text-red-600 border border-red-100" 
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {lot.expirationDate}
                            {expired && <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[200px] truncate" title={lot.notes}>
                        {lot.notes || <span className="text-slate-300 italic">No notes</span>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {lot.createdAt ? new Date(lot.createdAt).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE LOT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Tags className="w-4 h-4 text-[#017e84]" />
                Register New Lot/Serial
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Select Product <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.productId}
                  onChange={(e) => setForm(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#017e84]/20 focus:border-[#017e84] bg-white text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="">-- Choose Tracked Product --</option>
                  {trackedProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Tracking: {p.tracking})
                    </option>
                  ))}
                </select>
                {trackedProducts.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 font-medium">
                    No products have Lot or Serial tracking enabled. Edit products to enable tracking first.
                  </p>
                )}
              </div>

              {/* Lot / Serial Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Lot / Serial Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LOT-2026-001 or SN-X90A"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#017e84]/20 focus:border-[#017e84] bg-white text-slate-700"
                />
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={form.expirationDate}
                  onChange={(e) => setForm(prev => ({ ...prev, expirationDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#017e84]/20 focus:border-[#017e84] bg-white text-slate-700 cursor-pointer"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Notes
                </label>
                <textarea
                  placeholder="Add batch details, quality inspection records, or supplier comments..."
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#017e84]/20 focus:border-[#017e84] bg-white text-slate-700 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#017e84] hover:bg-[#01666b] text-white text-xs font-bold rounded-lg shadow-sm transition-all border-none cursor-pointer"
                >
                  Register Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
