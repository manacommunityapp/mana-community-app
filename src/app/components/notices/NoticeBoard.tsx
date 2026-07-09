import {
  Megaphone, Plus, X, Loader2, Pin, PinOff, Trash2, Edit3, Clock,
  AlertTriangle, Wrench, Shield, CalendarDays, Users, BookOpen, ChevronDown
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { noticeService, type NoticeResponse, type NoticeRequest } from "../../../services/noticeService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const categories = ["All", "GENERAL", "MAINTENANCE", "SAFETY", "EVENT", "MEETING", "RULE_CHANGE"];

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  GENERAL: { label: "General", icon: <Megaphone className="w-3.5 h-3.5" />, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  MAINTENANCE: { label: "Maintenance", icon: <Wrench className="w-3.5 h-3.5" />, color: "text-amber-600 bg-amber-50 border-amber-200" },
  SAFETY: { label: "Safety", icon: <Shield className="w-3.5 h-3.5" />, color: "text-red-500 bg-red-50 border-red-200" },
  EVENT: { label: "Event", icon: <CalendarDays className="w-3.5 h-3.5" />, color: "text-violet-600 bg-violet-50 border-violet-200" },
  MEETING: { label: "Meeting", icon: <Users className="w-3.5 h-3.5" />, color: "text-teal-600 bg-teal-50 border-teal-200" },
  RULE_CHANGE: { label: "Rule Change", icon: <BookOpen className="w-3.5 h-3.5" />, color: "text-orange-600 bg-orange-50 border-orange-200" },
};

const priorityConfig: Record<string, { label: string; dot: string }> = {
  LOW: { label: "Low", dot: "bg-slate-400" },
  NORMAL: { label: "Normal", dot: "bg-blue-500" },
  HIGH: { label: "High", dot: "bg-amber-500" },
  URGENT: { label: "Urgent", dot: "bg-red-500" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function NoticeBoard() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [notices, setNotices] = useState<NoticeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editNotice, setEditNotice] = useState<NoticeResponse | null>(null);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await noticeService.getNotices(activeCategory !== "All" ? activeCategory : undefined);
      setNotices(data);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const handlePin = async (id: number) => {
    try {
      await noticeService.togglePin(id);
      fetchNotices();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    try {
      await noticeService.deleteNotice(id);
      fetchNotices();
    } catch { /* ignore */ }
  };

  const handleSaved = () => {
    setShowCreate(false);
    setEditNotice(null);
    fetchNotices();
  };

  const pinned = notices.filter((n) => n.pinned);
  const unpinned = notices.filter((n) => !n.pinned);

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Community</span>
          <h1 className="text-3xl font-black text-[#0d0d2b] mt-1">Notice Board</h1>
          <p className="text-[#6b7094] text-sm mt-1">Announcements and updates from your community.</p>
        </div>
        <button
          onClick={() => { setEditNotice(null); setShowCreate(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white text-sm font-bold rounded-full transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4.5 h-4.5" />
          Post Notice
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar">
        {categories.map((cat) => {
          const cfg = categoryConfig[cat];
          return (
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
              {cfg?.label ?? cat}
            </button>
          );
        })}
      </div>

      {/* Notices */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Megaphone className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-[#6b7094] text-sm font-medium">No notices yet</p>
          <p className="text-slate-400 text-xs mt-1">Post the first announcement for your community!</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {pinned.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                <Pin className="w-3 h-3" /> Pinned
              </p>
              {pinned.map((n) => (
                <NoticeCard key={n.id} notice={n} onPin={handlePin} onDelete={handleDelete} onEdit={(n) => { setEditNotice(n); setShowCreate(true); }} />
              ))}
            </div>
          )}
          {unpinned.length > 0 && (
            <div className="space-y-3">
              {pinned.length > 0 && (
                <p className="text-[10px] font-bold text-[#6b7094] uppercase tracking-widest mt-6">Recent</p>
              )}
              {unpinned.map((n) => (
                <NoticeCard key={n.id} notice={n} onPin={handlePin} onDelete={handleDelete} onEdit={(n) => { setEditNotice(n); setShowCreate(true); }} />
              ))}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <NoticeFormModal
          existing={editNotice}
          onClose={() => { setShowCreate(false); setEditNotice(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function NoticeCard({
  notice, onPin, onDelete, onEdit,
}: {
  notice: NoticeResponse;
  onPin: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (n: NoticeResponse) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cat = categoryConfig[notice.category] ?? categoryConfig.GENERAL;
  const pri = priorityConfig[notice.priority] ?? priorityConfig.NORMAL;

  return (
    <div className={cn(
      "bg-white rounded-2xl border overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.03)] transition-all",
      notice.pinned ? "border-indigo-200 ring-1 ring-indigo-100" : "border-[#6366f1]/12"
    )}>
      <div
        className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          {/* Priority dot */}
          <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0", pri.dot)} title={pri.label} />

          <div className="flex-1 min-w-0">
            {/* Top row: category + time */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", cat.color)}>
                {cat.icon} {cat.label}
              </span>
              {notice.pinned && <Pin className="w-3 h-3 text-indigo-500" />}
              <span className="text-[10px] text-slate-400 ml-auto shrink-0">{timeAgo(notice.createdAt)}</span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-[#0d0d2b] text-sm leading-snug">{notice.title}</h3>

            {/* Preview or full body */}
            <p className={cn(
              "text-[#6b7094] text-xs leading-relaxed mt-1.5",
              !expanded && "line-clamp-2"
            )}>
              {notice.body}
            </p>

            {/* Expanded metadata */}
            {expanded && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-[11px] text-[#6b7094]">
                  <span className="font-medium text-[#0d0d2b]">{notice.authorName}</span>
                  <span>{formatDate(notice.createdAt)}</span>
                  {notice.expiresOn && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Clock className="w-3 h-3" /> Expires {formatDate(notice.expiresOn)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onPin(notice.id); }}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title={notice.pinned ? "Unpin" : "Pin"}
                  >
                    {notice.pinned ? <PinOff className="w-3.5 h-3.5 text-indigo-500" /> : <Pin className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(notice); }}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(notice.id); }}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0 mt-1", expanded && "rotate-180")} />
        </div>
      </div>
    </div>
  );
}

function NoticeFormModal({
  existing, onClose, onSaved,
}: {
  existing: NoticeResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<NoticeRequest>({
    title: existing?.title ?? "",
    body: existing?.body ?? "",
    category: existing?.category ?? "GENERAL",
    priority: existing?.priority ?? "NORMAL",
    pinned: existing?.pinned ?? false,
    expiresOn: existing?.expiresOn ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError("Title and body are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (existing) {
        await noticeService.update(existing.id, form);
      } else {
        await noticeService.create(form);
      }
      onSaved();
    } catch {
      setError("Failed to save notice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof NoticeRequest, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-[#0d0d2b]">{existing ? "Edit Notice" : "Post Notice"}</h2>
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
              maxLength={200}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              placeholder="e.g. Water supply maintenance on Saturday"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Body *</label>
            <textarea
              value={form.body}
              onChange={(e) => update("body", e.target.value)}
              maxLength={5000}
              rows={5}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
              placeholder="Provide details about the announcement..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              >
                {Object.entries(categoryConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              >
                {Object.entries(priorityConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Expires On</label>
              <input
                type="date"
                value={form.expiresOn ?? ""}
                onChange={(e) => update("expiresOn", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => update("pinned", e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-[#0d0d2b]">Pin to top</span>
              </label>
            </div>
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
              {saving ? "Saving..." : existing ? "Update" : "Post Notice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
