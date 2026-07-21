import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Search, MapPin, Plus, X, Loader2, ImagePlus, Calendar,
  ChevronLeft, ChevronRight, AlertTriangle, Eye, CheckCircle
} from "lucide-react";
import {
  lostAndFoundService, type LostAndFoundResponse, type LostAndFoundRequest
} from "../../../services/listingService";
import { useAuth } from "../../../contexts/AuthContext";
import { USE_MOCK_DATA, MOCK_LOST_AND_FOUND, paginate } from "./mockData";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function LostAndFoundPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"all" | "LOST" | "FOUND">("all");
  const [posts, setPosts] = useState<LostAndFoundResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchPosts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      if (USE_MOCK_DATA) {
        const filtered = tab === "all" ? MOCK_LOST_AND_FOUND : MOCK_LOST_AND_FOUND.filter((i) => i.type === tab);
        const data = paginate(filtered, p, 12);
        setPosts(data.content);
        setTotalPages(data.totalPages);
      } else {
        const data = await lostAndFoundService.getPosts(tab === "all" ? undefined : tab, p);
        setPosts(data.content);
        setTotalPages(data.totalPages);
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { setPage(0); }, [tab]);
  useEffect(() => { fetchPosts(page); }, [fetchPosts, page]);

  const handleResolve = async (id: number) => {
    try {
      const updated = await lostAndFoundService.resolve(id);
      setPosts((prev) => prev.map((p) => p.id === id ? updated : p));
    } catch {}
  };

  const handleCreated = () => {
    setShowCreate(false);
    setPage(0);
    fetchPosts(0);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-black text-[#0d0d2b]">
          <AlertTriangle className="inline w-5 h-5 text-amber-500 mr-2" />
          Lost & Found
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(["all", "LOST", "FOUND"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize",
                  tab === t ? "bg-white text-[#0d0d2b] shadow-sm" : "text-[#6b7094]"
                )}
              >
                {t === "all" ? "All" : t === "LOST" ? "Lost Items" : "Found Items"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-full cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-[#6b7094] text-sm font-medium">No reports found</p>
          <p className="text-slate-400 text-xs mt-1">Report a lost or found item to help your community</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((item) => {
              const isOwner = user?.userId && Number(user.userId) === item.reporter.id;
              const isLost = item.type === "LOST";
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-amber-200 transition-all">
                  <div className="h-40 bg-slate-50 relative">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {isLost ? <AlertTriangle className="w-10 h-10 text-slate-300" /> : <Eye className="w-10 h-10 text-slate-300" />}
                      </div>
                    )}
                    <div className={cn(
                      "absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                      isLost ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {item.type}
                    </div>
                    {item.status === "RESOLVED" && (
                      <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" /> Resolved
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-bold text-[#0d0d2b]">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-[#6b7094] mt-1 line-clamp-2">{item.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.location && (
                        <span className="flex items-center gap-1 text-[10px] text-[#6b7094]">
                          <MapPin className="w-3 h-3" /> {item.location}
                        </span>
                      )}
                      {item.dateOccurred && (
                        <span className="flex items-center gap-1 text-[10px] text-[#6b7094]">
                          <Calendar className="w-3 h-3" /> {new Date(item.dateOccurred).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-[#6b7094]">
                        by <span className="font-semibold">{item.reporter.fullName}</span> · {timeAgo(item.createdAt)}
                      </p>
                      {isOwner && item.status === "OPEN" && (
                        <button
                          onClick={() => handleResolve(item.id)}
                          className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
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

      {showCreate && <CreateLostFoundModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}

function CreateLostFoundModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<LostAndFoundRequest>({ title: "", type: "LOST", description: "", category: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    try {
      await lostAndFoundService.create(form);
      onCreated();
    } catch { setError("Failed to submit report"); }
    finally { setSaving(false); }
  };

  const update = (field: keyof LostAndFoundRequest, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-[#0d0d2b]">Report Lost / Found Item</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-5 h-5 text-[#6b7094]" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-red-500 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            {(["LOST", "FOUND"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => update("type", t)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold border transition-all cursor-pointer",
                  form.type === t
                    ? t === "LOST" ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-white border-slate-200 text-[#6b7094]"
                )}
              >
                {t === "LOST" ? "I Lost Something" : "I Found Something"}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">What was {form.type === "LOST" ? "lost" : "found"}? *</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} maxLength={150} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20" placeholder="e.g. Blue wallet, keys, pet cat..." />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} maxLength={2000} rows={3} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 resize-none" placeholder="Describe distinguishing features..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Location</label>
              <input value={form.location} onChange={(e) => update("location", e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500" placeholder="Near Tower C park..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Date</label>
              <input type="date" value={form.dateOccurred || ""} onChange={(e) => update("dateOccurred", e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-[#6b7094] hover:bg-slate-50 rounded-xl cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 cursor-pointer flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
