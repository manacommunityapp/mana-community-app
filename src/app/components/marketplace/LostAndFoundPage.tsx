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

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
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
      const data = await lostAndFoundService.getPosts(tab === "all" ? undefined : tab, p);
      setPosts(data.content);
      setTotalPages(data.totalPages);
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
    <div className="space-y-4 text-slate-900 dark:text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Community Lost & Found
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-[#262644] rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            {(["all", "LOST", "FOUND"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer capitalize",
                  tab === t ? "bg-white dark:bg-[#1E1E36] text-amber-600 shadow-sm" : "text-slate-500"
                )}
              >
                {t === "all" ? "All Items" : t === "LOST" ? "Lost" : "Found"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" /> Report Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-6">
          <AlertTriangle className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No items reported</p>
          <p className="text-slate-400 text-xs mt-1">If you lost or found something around the community, report it here!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((item) => {
            const isOwner = user?.userId && Number(user.userId) === item.reporter.id;
            const isResolved = item.status === "RESOLVED";

            return (
              <div key={item.id} className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-xs group">
                <div className="h-44 bg-slate-100 dark:bg-[#262644] relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Search className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                  <span className={cn(
                    "absolute top-2 left-2 px-2.5 py-0.5 text-white text-[10px] font-black uppercase tracking-wider rounded-full",
                    item.type === "LOST" ? "bg-rose-500" : "bg-emerald-500"
                  )}>
                    {item.type}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                    {item.location && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mt-2">
                        <MapPin className="w-3 h-3 text-amber-500" /> {item.location}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">Reported {timeAgo(item.createdAt)}</span>
                    {isResolved ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Resolved
                      </span>
                    ) : isOwner ? (
                      <button
                        onClick={() => handleResolve(item.id)}
                        className="px-3 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg cursor-pointer hover:bg-amber-600"
                      >
                        Mark Resolved
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreateLostAndFoundModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}

function CreateLostAndFoundModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"LOST" | "FOUND">("LOST");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await lostAndFoundService.create({ title, description, type, location });
      onCreated();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1E1E36] rounded-3xl shadow-2xl w-full max-w-md p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Report Lost / Found Item</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Type *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("LOST")}
                className={cn("py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer", type === "LOST" ? "bg-rose-500 text-white border-rose-500" : "bg-slate-50 dark:bg-[#262644] text-slate-600 border-slate-200 dark:border-slate-700")}
              >
                I Lost Something
              </button>
              <button
                type="button"
                onClick={() => setType("FOUND")}
                className={cn("py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer", type === "FOUND" ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-50 dark:bg-[#262644] text-slate-600 border-slate-200 dark:border-slate-700")}
              >
                I Found Something
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
              placeholder="e.g. Set of Keys with Blue Keychain"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
              placeholder="e.g. Near Swimming Pool area"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white resize-none"
              placeholder="Describe the item or how to claim it..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-400">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
