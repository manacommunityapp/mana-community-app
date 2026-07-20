import { Search, Tag, MapPin, CheckCircle, Plus, X, Loader2, ImagePlus, ShoppingBag, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { listingService, type ListingResponse, type ListingRequest } from "../../../services/listingService";
import { useAuth } from "../../../contexts/AuthContext";
import { useChat } from "../../../contexts/ChatContext";
import { CREATE_LISTING } from "../../../constants/permissions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const categories = ["All", "Homemade Food", "Electronics", "Vehicles", "Real Estate", "Services"];
const transactionModes = [
  { value: "CHAT_ONLY", label: "Chat Only" },
  { value: "CHAT_CALL", label: "Chat & Call" },
  { value: "IN_APP_PAYMENT", label: "In-App Payment" },
];

function formatPrice(price: number, unit?: string): string {
  const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
  return unit ? `${formatted} / ${unit}` : formatted;
}

export function Marketplace() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const { hasPermission } = useAuth();
  const canCreate = hasPermission(CREATE_LISTING);

  const fetchListings = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await listingService.getListings(
        activeCategory !== "All" ? activeCategory : undefined,
        searchQuery || undefined,
        pageNum,
        12
      );
      setListings(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setListings([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => fetchListings(page), searchQuery ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchListings, page, searchQuery]);

  const handleCreated = () => {
    setShowCreate(false);
    setPage(0);
    fetchListings(0);
  };

  return (
    <div className="text-[#0d0d2b] font-sans">

      {/* Search, Filters, and Post button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-[#0d0d2b]">Browse Listings</h2>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white text-sm font-bold rounded-full transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Post Advertisement
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7094] w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="Search for biryani, bikes, electronics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border",
                activeCategory === cat
                  ? "bg-[#0d0d2b] text-white border-transparent shadow-sm"
                  : "bg-white text-[#6b7094] border-slate-200 hover:text-[#0d0d2b] hover:bg-slate-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-[#6b7094] text-sm font-medium">No listings found</p>
          <p className="text-slate-400 text-xs mt-1">Be the first to post an advertisement!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {listings.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#6b7094] bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-[#6b7094]">
                Page <span className="font-bold text-[#0d0d2b]">{page + 1}</span> of{" "}
                <span className="font-bold text-[#0d0d2b]">{totalPages}</span>
                <span className="hidden sm:inline text-slate-400 ml-2">({totalElements} listings)</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#6b7094] bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && <CreateListingModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}

function ListingCard({ item }: { item: ListingResponse }) {
  const imageUrl = item.imageUrls?.[0];
  const { startConversation } = useChat();
  const navigate = useNavigate();

  const handleContact = () => {
    startConversation(String(item.seller.id));
  };

  return (
    <div className="bg-white rounded-2xl border border-[#6366f1]/12 overflow-hidden flex flex-col hover:border-indigo-500/20 hover:shadow-md transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.03)] group cursor-pointer" onClick={() => navigate(`/marketplace/${item.id}`)}>
      <div className="h-48 relative overflow-hidden bg-slate-50">
        {imageUrl ? (
          <img src={imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImagePlus className="w-10 h-10 text-slate-300" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0d0d2b] shadow-md border border-[#6366f1]/12">
          {formatPrice(item.price, item.priceUnit)}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-2">
            <Tag className="w-3 h-3" /> {item.category}
          </div>
          <h3 className="font-extrabold text-[#0d0d2b] text-base leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
            {item.title}
          </h3>
          <p className="text-[#6b7094] text-xs leading-relaxed mb-4 line-clamp-3">
            {item.description}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600">
              {item.seller.fullName?.charAt(0) ?? "?"}
            </div>
            <div>
              <div className="text-xs font-bold text-[#0d0d2b] flex items-center gap-1">
                {item.seller.fullName}
                {item.seller.verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />}
              </div>
              {item.location && (
                <div className="text-[10px] text-[#6b7094] flex items-center gap-0.5 mt-0.5">
                  <MapPin className="w-3 h-3 text-[#6b7094]" /> {item.location}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleContact(); }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Contact
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateListingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<ListingRequest>({
    title: "",
    price: 0,
    category: "Homemade Food",
    description: "",
    priceUnit: "",
    transactionMode: "CHAT_ONLY",
    visibility: "COMMUNITY",
    location: "",
    imageUrls: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price) {
      setError("Title and price are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await listingService.create(form);
      onCreated();
    } catch {
      setError("Failed to create listing. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof ListingRequest, value: string | number | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-[#0d0d2b]">Post Advertisement</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5 text-[#6b7094]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-red-500 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              maxLength={150}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              placeholder="e.g. Homemade Biryani – Sunday Special"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
              placeholder="Describe your item or service..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Price (₹) *</label>
              <input
                type="number"
                min={0}
                value={form.price || ""}
                onChange={(e) => update("price", parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                placeholder="350"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Price Unit</label>
              <input
                value={form.priceUnit}
                onChange={(e) => update("priceUnit", e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                placeholder="portion, kg, hour..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              >
                {categories.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Contact Mode</label>
              <select
                value={form.transactionMode}
                onChange={(e) => update("transactionMode", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              >
                {transactionModes.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Location</label>
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              placeholder="Tower B, Apt 402"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-[#6b7094] hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Posting..." : "Post Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
