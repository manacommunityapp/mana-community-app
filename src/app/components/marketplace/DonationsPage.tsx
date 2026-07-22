import { useState, useEffect, useCallback } from "react";
import {
  Gift, Heart, Plus, X, Loader2, Tag,
  ChevronLeft, ChevronRight, HandHeart, Check
} from "lucide-react";
import {
  donationService, type DonationResponse, type DonationRequest
} from "../../../services/listingService";
import { useAuth } from "../../../contexts/AuthContext";
import { USE_MOCK_DATA, MOCK_DONATIONS, paginate } from "./mockData";

const conditionLabels: Record<string, string> = {
  NEW: "Brand New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  FAIR: "Fair",
};

const categories = ["Clothing", "Books", "Electronics", "Furniture", "Toys", "Kitchen", "Other"];

export function DonationsPage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<DonationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
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
    } catch {}
  };

  const handleCreated = () => {
    setShowCreate(false);
    setPage(0);
    fetchDonations(0);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-[#0d0d2b]">
          <Gift className="inline w-5 h-5 text-violet-500 mr-2" />
          Community Donations
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold rounded-full cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Donate Item
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      ) : donations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <HandHeart className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-[#6b7094] text-sm font-medium">No donations available</p>
          <p className="text-slate-400 text-xs mt-1">Be the first to donate something to the community!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {donations.map((item) => {
              const isOwner = user?.userId && Number(user.userId) === item.donor.id;
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-violet-200 transition-all">
                  <div className="h-40 bg-slate-50 relative">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gift className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold text-violet-600 border border-violet-100">
                      {conditionLabels[item.condition] || item.condition}
                    </div>
                    {item.status !== "AVAILABLE" && (
                      <div className="absolute top-2 left-2 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {item.status}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-1 text-[10px] text-violet-600 font-bold uppercase tracking-wider mb-1">
                      <Tag className="w-3 h-3" /> {item.category}
                    </div>
                    <h3 className="text-sm font-bold text-[#0d0d2b]">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-[#6b7094] mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-xs text-[#6b7094] mt-2">Donated by <span className="font-semibold">{item.donor.fullName}</span></p>

                    {item.status === "AVAILABLE" && !isOwner && (
                      <button
                        onClick={() => handleClaim(item.id)}
                        className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 bg-violet-50 hover:bg-violet-100 text-violet-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5" /> Claim This Item
                      </button>
                    )}
                    {item.claimedByName && (
                      <p className="text-xs text-emerald-600 font-semibold mt-3 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Claimed by {item.claimedByName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#6b7094] bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm text-[#6b7094]">Page <span className="font-bold text-[#0d0d2b]">{page + 1}</span> of <span className="font-bold text-[#0d0d2b]">{totalPages}</span></span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#6b7094] bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && <CreateDonationModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}

function CreateDonationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<DonationRequest>({ title: "", category: "Clothing", description: "", condition: "GOOD" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    try {
      await donationService.create(form);
      onCreated();
    } catch { setError("Failed to create donation"); }
    finally { setSaving(false); }
  };

  const update = (field: keyof DonationRequest, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-[#0d0d2b]">Donate an Item</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-5 h-5 text-[#6b7094]" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-red-500 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Item Name *</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} maxLength={150} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20" placeholder="e.g. Children's Books Collection" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} maxLength={2000} rows={3} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 resize-none" placeholder="Describe the item..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Category *</label>
              <select value={form.category} onChange={(e) => update("category", e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Condition</label>
              <select value={form.condition} onChange={(e) => update("condition", e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500">
                {Object.entries(conditionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-[#6b7094] hover:bg-slate-50 rounded-xl cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 cursor-pointer flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Posting..." : "Donate Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
