import { useState, useEffect, useCallback } from "react";
import {
  Gift, Heart, Plus, X, Loader2, Tag,
  ChevronLeft, ChevronRight, HandHeart, Check, ImagePlus,
  Repeat, Calendar, ShieldCheck, MessageCircle, Send
} from "lucide-react";
import {
  donationService, type DonationResponse, type DonationRequest
} from "../../../services/marketplace/listingService";
import { useAuth } from "../../../contexts/AuthContext";
import { useChat } from "../../../contexts/ChatContext";
import { USE_MOCK_DATA, MOCK_DONATIONS, paginate } from "./mockData";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const conditionLabels: Record<string, string> = {
  NEW: "Brand New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  FAIR: "Fair",
};

const categories = ["Clothing", "Books", "Electronics", "Furniture", "Toys", "Kitchen", "Other"];

export function DonationsPage() {
  const { user } = useAuth();
  const { startConversation } = useChat();
  const [donations, setDonations] = useState<DonationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "DONATION" | "EXCHANGE" | "BORROW">("ALL");
  const [selectedExchangeItem, setSelectedExchangeItem] = useState<DonationResponse | null>(null);
  const [exchangeOfferText, setExchangeOfferText] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchDonations = useCallback(async (p: number) => {
    setLoading(true);
    try {
      if (USE_MOCK_DATA) {
        const data = paginate(MOCK_DONATIONS, p, 12);
        setDonations(data.content);
        setTotalPages(data.totalPages);
      } else {
        const data = await donationService.getCommunityDonations(p);
        setDonations(data.content);
        setTotalPages(data.totalPages);
      }
    } catch {
      setDonations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDonations(page); }, [fetchDonations, page]);

  const handleClaim = async (id: number) => {
    try {
      const updated = await donationService.claim(id);
      setDonations((prev) => prev.map((d) => d.id === id ? updated : d));
      showSuccess("Item claimed! Contact donor for handover pass.");
    } catch {}
  };

  const handleProposeExchange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExchangeItem || !exchangeOfferText) return;
    startConversation(String(selectedExchangeItem.donor.id));
    showSuccess(`Exchange proposal sent to ${selectedExchangeItem.donor.fullName}!`);
    setSelectedExchangeItem(null);
    setExchangeOfferText("");
  };

  const handleCreated = () => {
    setShowCreate(false);
    setPage(0);
    fetchDonations(0);
  };

  return (
    <div className="space-y-4 text-slate-900 dark:text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-violet-600" /> Community Sharing, Donations & Barter
          </h2>
          <p className="text-xs text-slate-400">Give away unused items, borrow tools for free, or exchange goods with neighbors.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-violet-500/20 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> Share / Donate Item
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "ALL", label: "All Items" },
          { id: "DONATION", label: "🎁 Free Giveaways" },
          { id: "EXCHANGE", label: "🔄 Barter / Exchange" },
          { id: "BORROW", label: "⏱️ Free Borrow & Return" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={cn(
              "px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap",
              activeTab === t.id
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        </div>
      ) : donations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-6">
          <HandHeart className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No items listed in community sharing yet</p>
          <p className="text-slate-400 text-xs mt-1">Donate pre-loved books, toys, clothing, or furniture to give back to neighbors!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-5 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-violet-700 transition-all"
          >
            + Post First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {donations.map((item) => {
            const isOwner = user?.userId && Number(user.userId) === item.donor.id;
            return (
              <div key={item.id} className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-xs group hover:border-violet-300 transition-all">
                <div className="h-44 bg-slate-100 dark:bg-[#262644] relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                    FREE
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 font-extrabold uppercase tracking-wider mb-1">
                      <Tag className="w-3 h-3" /> {item.category} • {conditionLabels[item.condition] || item.condition}
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400">By {item.donor.fullName}</span>
                    {item.status === "AVAILABLE" && !isOwner && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedExchangeItem(item)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-[#262644] hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Repeat className="w-3 h-3 text-violet-600" /> Barter
                        </button>
                        <button
                          onClick={() => handleClaim(item.id)}
                          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                        >
                          Claim
                        </button>
                      </div>
                    )}
                    {item.status === "CLAIMED" && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        Claimed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Propose Exchange Modal */}
      {selectedExchangeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1E1E36] rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Repeat className="w-4 h-4 text-violet-600" /> Propose Item Exchange / Barter
              </h3>
              <button onClick={() => setSelectedExchangeItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              For item: <span className="font-bold text-slate-900 dark:text-white">"{selectedExchangeItem.title}"</span> by {selectedExchangeItem.donor.fullName}
            </p>
            <form onSubmit={handleProposeExchange} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">What item are you offering in exchange? *</label>
                <textarea
                  rows={3}
                  required
                  value={exchangeOfferText}
                  onChange={(e) => setExchangeOfferText(e.target.value)}
                  placeholder="e.g. I have a baby wooden crib and storybook set in good condition to trade..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-600 text-slate-900 dark:text-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedExchangeItem(null)}
                  className="px-4 py-2 font-bold text-slate-500 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-500/20"
                >
                  Send Proposal & Open Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreate && <CreateDonationModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}

function CreateDonationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Clothing");
  const [condition, setCondition] = useState("GOOD");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await donationService.create({ title, description, category, condition, imageUrl: imageUrl || undefined });
      showSuccess("Item donated to the community!");
      onCreated();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1E1E36] rounded-3xl shadow-2xl w-full max-w-md p-5 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Donate Pre-Loved Item</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Item Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-600 text-slate-900 dark:text-white"
              placeholder="e.g. Children Story Books Set"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Item Photo</label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-700">
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-violet-600 transition-colors">
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[8px] font-bold mt-0.5">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-600 text-slate-900 dark:text-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-600 text-slate-900 dark:text-white"
            >
              <option value="NEW">Brand New</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description & Pickup Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-600 text-slate-900 dark:text-white resize-none"
              placeholder="Provide pickup location (e.g. Tower B - 402) and times..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-400">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Submitting..." : "Post Donation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
