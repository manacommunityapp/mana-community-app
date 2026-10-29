import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  ShoppingBag,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  DollarSign,
  Search,
  Filter,
  Layers,
  Sparkles,
  X,
  Tag,
  Dumbbell,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { sportsCommerceService } from "../../../../../services/sports/sportsCommerceService";
import type {
  SportsMerchandiseItem,
  SupplierQuoteRequest,
  MerchandiseCategory,
  QuoteStatus,
} from "../../../../../types/sportsCommerce";
import type { SportType } from "../../../../../types/sportsVendor";

const MERCH_CATEGORIES: { key: MerchandiseCategory; label: string }[] = [
  { key: "JERSEY_CUSTOM", label: "Custom Teamwear & Jerseys" },
  { key: "TROPHY_MEDAL", label: "Trophies, Shields & Medals" },
  { key: "EQUIPMENT_RENTAL", label: "Equipment & Match Kit Rentals" },
  { key: "MATCH_BALLS_GEAR", label: "Match Balls & Protective Gear" },
  { key: "STRINGING_REPAIR", label: "Racquet Stringing & Repairs" },
];

const QUOTE_STEPS: QuoteStatus[] = [
  "PENDING_REVIEW",
  "QUOTE_PROVIDED",
  "APPROVED_DEPOSIT_PAID",
  "IN_PRODUCTION",
  "DISPATCHED",
  "DELIVERED",
];

export function SportsSuppliersPortal() {
  const [activeTab, setActiveTab] = useState<"CATALOGUE" | "QUOTES">("CATALOGUE");
  const [items, setItems] = useState<SportsMerchandiseItem[]>([]);
  const [quotes, setQuotes] = useState<SupplierQuoteRequest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<SupplierQuoteRequest | null>(null);
  const [quotePriceInput, setQuotePriceInput] = useState<number>(0);

  // New Item Form
  const [itemForm, setItemForm] = useState<{
    title: string;
    category: MerchandiseCategory;
    sport: SportType;
    description: string;
    basePrice: number;
    availableStock: number;
    unitOfMeasure: string;
    leadTimeDays: number;
    rentalDailyPrice?: number;
    rentalDeposit?: number;
  }>({
    title: "",
    category: "JERSEY_CUSTOM",
    sport: "BADMINTON",
    description: "",
    basePrice: 550,
    availableStock: 100,
    unitOfMeasure: "Piece",
    leadTimeDays: 4,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mList, qList] = await Promise.all([
        sportsCommerceService.getMerchandise(),
        sportsCommerceService.getQuoteRequests(),
      ]);
      setItems(mList);
      setQuotes(qList);
    } catch (err) {
      toast.error("Failed to load sports supplier data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemForm.title) {
      toast.error("Please enter product title");
      return;
    }

    try {
      const saved = await sportsCommerceService.saveMerchandise({
        title: itemForm.title,
        category: itemForm.category,
        sport: itemForm.sport,
        description: itemForm.description,
        basePrice: Number(itemForm.basePrice),
        availableStock: Number(itemForm.availableStock),
        unitOfMeasure: itemForm.unitOfMeasure,
        leadTimeDays: Number(itemForm.leadTimeDays),
        rentalDailyPrice: itemForm.rentalDailyPrice ? Number(itemForm.rentalDailyPrice) : undefined,
        rentalDeposit: itemForm.rentalDeposit ? Number(itemForm.rentalDeposit) : undefined,
      });
      setItems((prev) => [saved, ...prev]);
      setShowItemModal(false);
      toast.success("Merchandise item added to sports catalogue!");
    } catch (err) {
      toast.error("Failed to save merchandise");
    }
  }

  async function handleSubmitQuote(quoteId: string) {
    if (!quotePriceInput || quotePriceInput <= 0) {
      toast.error("Please enter a valid quoted price");
      return;
    }

    try {
      const updated = await sportsCommerceService.submitQuote(quoteId, quotePriceInput);
      setQuotes((prev) => prev.map((q) => (q.id === quoteId ? updated : q)));
      setSelectedQuote(null);
      toast.success("Official quotation submitted to organizer!");
    } catch (err) {
      toast.error("Error submitting quote");
    }
  }

  async function handleAdvanceQuoteStatus(quoteId: string, currentStatus: QuoteStatus) {
    const nextIdx = QUOTE_STEPS.indexOf(currentStatus) + 1;
    if (nextIdx >= QUOTE_STEPS.length) return;
    const nextStatus = QUOTE_STEPS[nextIdx];

    try {
      const updated = await sportsCommerceService.updateQuoteStatus(quoteId, nextStatus);
      setQuotes((prev) => prev.map((q) => (q.id === quoteId ? updated : q)));
      toast.success(`Order milestone updated to: ${nextStatus.replace(/_/g, " ")}`);
    } catch (err) {
      toast.error("Failed to advance quote status");
    }
  }

  const filteredItems = items.filter((it) => {
    if (selectedCategory !== "ALL" && it.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sports Commerce & Teamwear Supplier</h1>
          <p className="text-xs text-slate-500">
            Manage custom jerseys, tournament trophies, match equipment rentals, racquet stringing, and organizer quotations.
          </p>
        </div>

        <button
          onClick={() => setShowItemModal(true)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Merchandise / Service
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab("CATALOGUE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "CATALOGUE"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Catalogue & Rentals ({items.length})
        </button>

        <button
          onClick={() => setActiveTab("QUOTES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "QUOTES"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Organizer Bulk Quotations ({quotes.length})
        </button>
      </div>

      {/* Tab 1: Catalogue & Rentals */}
      {activeTab === "CATALOGUE" && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Categories
            </button>
            {MERCH_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {item.sport}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Lead: {item.leadTimeDays}d
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="text-[11px] text-slate-600 pt-1 flex items-center justify-between">
                    <span>Stock: <strong>{item.availableStock}</strong> {item.unitOfMeasure}</span>
                    {item.rentalDeposit && (
                      <span className="text-amber-700 font-semibold">Deposit: ₹{item.rentalDeposit}</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      {item.category === "EQUIPMENT_RENTAL" ? "Daily Rental" : "Base Unit Price"}
                    </span>
                    <span className="text-base font-black text-slate-900">
                      ₹{item.rentalDailyPrice || item.basePrice}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Organizer Bulk Quotations */}
      {activeTab === "QUOTES" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Organizer & Tournament</th>
                  <th className="py-3.5 px-4">Category & Qty</th>
                  <th className="py-3.5 px-4">Specifications</th>
                  <th className="py-3.5 px-4">Required Date</th>
                  <th className="py-3.5 px-4">Quoted Price</th>
                  <th className="py-3.5 px-4">Milestone</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{q.organizerName}</span>
                      <span className="text-[11px] text-indigo-700 font-medium block">
                        {q.tournamentTitle}
                      </span>
                      <span className="text-[10px] text-slate-400">{q.organizerPhone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block text-[11px]">
                        {q.itemType.replace("_", " ")}
                      </span>
                      <span className="text-[11px] text-slate-500 font-bold">Qty: {q.quantity}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {q.specifications}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{q.requiredByDate}</td>
                    <td className="py-3.5 px-4">
                      {q.quotedAmount ? (
                        <span className="font-black text-slate-900 text-sm">₹{q.quotedAmount}</span>
                      ) : (
                        <span className="text-amber-600 font-bold text-[11px]">Pending Quote</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          q.status === "DELIVERED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : q.status === "IN_PRODUCTION"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {q.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!q.quotedAmount ? (
                        <button
                          onClick={() => {
                            setSelectedQuote(q);
                            setQuotePriceInput(q.targetBudget || 10000);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-xs"
                        >
                          Quote Price
                        </button>
                      ) : q.status !== "DELIVERED" ? (
                        <button
                          onClick={() => handleAdvanceQuoteStatus(q.id, q.status)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors shadow-xs"
                        >
                          Next Step
                        </button>
                      ) : (
                        <span className="text-slate-400 font-bold text-[11px]">Complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quote Submission Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Submit Price Quote</h3>
              <button onClick={() => setSelectedQuote(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Organizer Request</span>
                <p className="font-bold text-slate-900">{selectedQuote.organizerName}</p>
                <p className="text-indigo-600">{selectedQuote.tournamentTitle}</p>
              </div>
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                {selectedQuote.specifications}
              </p>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Total Quoted Amount (₹)</label>
                <input
                  type="number"
                  step="500"
                  value={quotePriceInput}
                  onChange={(e) => setQuotePriceInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl text-base font-bold text-slate-900"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuote(null)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitQuote(selectedQuote.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Send Official Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Merchandise / Equipment Item</h3>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sublimated Match Jersey, Heavy Tennis Ball Kit..."
                  value={itemForm.title}
                  onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as MerchandiseCategory })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {MERCH_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sport</label>
                  <select
                    value={itemForm.sport}
                    onChange={(e) => setItemForm({ ...itemForm, sport: e.target.value as SportType })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="BADMINTON">BADMINTON</option>
                    <option value="CRICKET">CRICKET</option>
                    <option value="FOOTBALL">FOOTBALL</option>
                    <option value="TENNIS">TENNIS</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={itemForm.basePrice}
                    onChange={(e) => setItemForm({ ...itemForm, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock</label>
                  <input
                    type="number"
                    min="1"
                    value={itemForm.availableStock}
                    onChange={(e) => setItemForm({ ...itemForm, availableStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.leadTimeDays}
                    onChange={(e) => setItemForm({ ...itemForm, leadTimeDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Description</label>
                <textarea
                  rows={2}
                  placeholder="Material specs, printing details, kit contents..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
                  Save to Catalogue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
