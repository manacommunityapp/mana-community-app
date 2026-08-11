import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {

  ImageIcon, Play, Upload, Grid3X3, List, Star, Loader2, AlertCircle,
  Calendar, Filter, X, ChevronRight, Download, Share2, Layers, Tag, Film, CheckCircle2, ChevronDown,
  Plus, Trash2, CalendarDays, Save, Send,

} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { FilterChip, FilterChipRow, ErrorBanner, LoadingSpinner, EmptyState } from "./shared";
import { eventGalleryService, type EventGalleryItemResponse } from "../../../services/events/eventGalleryService";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { eventDayService, type EventDayResponse } from "../../../services/events/eventDayService";
import { eventMediaCategoryService, type EventMediaCategoryResponse } from "../../../services/events/eventMediaCategoryService";
import { fileUploadService } from "../../../services/files/fileUploadService";
import { validateMediaFile } from "../../../utils/mediaValidator";

export interface GalleryItem {
  id: number;
  url: string;
  title: string;
  eventName: string;
  eventId?: number;
  year: number;
  dayLabel: string;
  category: string;
  type: "photo" | "video";
  album: string;
  uploader?: string;
  dateStr?: string;
}

const MOCK_EVENTS_LIST = [
  { id: 1, title: "Ganesh Chaturthi Utsav 2026", year: 2026 },
  { id: 2, title: "Annual Sports Olympiad 2026", year: 2026 },
  { id: 3, title: "Navratri Garba & Cultural 2025", year: 2025 },
  { id: 4, title: "Diwali Community Carnival 2025", year: 2025 },
  { id: 5, title: "New Year Celebration 2024", year: 2024 },
];

const MOCK_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80",
    title: "Morning Prana Pratishtha & Archana",
    eventName: "Ganesh Chaturthi Utsav 2026",
    eventId: 1,
    year: 2026,
    dayLabel: "Day 1",
    category: "Puja & Rituals",
    type: "photo",
    album: "Morning Rituals",
    uploader: "Pandit Sharma",
    dateStr: "Aug 27, 2026",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    title: "Kids Classical Bharatanatyam Performance",
    eventName: "Ganesh Chaturthi Utsav 2026",
    eventId: 1,
    year: 2026,
    dayLabel: "Day 2",
    category: "Cultural Stage",
    type: "photo",
    album: "Cultural Extravaganza",
    uploader: "Anita Rao",
    dateStr: "Aug 28, 2026",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80",
    title: "Badminton Men's Singles Semi-Finals",
    eventName: "Annual Sports Olympiad 2026",
    eventId: 2,
    year: 2026,
    dayLabel: "Day 1",
    category: "Sports & Games",
    type: "photo",
    album: "Racquet Sports",
    uploader: "Sports Committee",
    dateStr: "Jul 12, 2026",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80",
    title: "Volunteers Managing Food Counters",
    eventName: "Ganesh Chaturthi Utsav 2026",
    eventId: 1,
    year: 2026,
    dayLabel: "Day 3",
    category: "Volunteers & Ops",
    type: "photo",
    album: "Community Service",
    uploader: "Rahul Nair",
    dateStr: "Aug 29, 2026",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
    title: "Sponsor Stage Banner Unveiling",
    eventName: "Annual Sports Olympiad 2026",
    eventId: 2,
    year: 2026,
    dayLabel: "Day 2",
    category: "Sponsors & Stalls",
    type: "photo",
    album: "Sponsors",
    uploader: "Finance Desk",
    dateStr: "Jul 13, 2026",
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
    title: "Community Maha Prasadam Feast",
    eventName: "Ganesh Chaturthi Utsav 2026",
    eventId: 1,
    year: 2026,
    dayLabel: "Day 3",
    category: "Food & Feast",
    type: "photo",
    album: "Maha Prasadam",
    uploader: "Food Committee",
    dateStr: "Aug 29, 2026",
  },
  {
    id: 7,
    url: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&q=80",
    title: "Grand Visarjan Dhol Tasha Procession",
    eventName: "Ganesh Chaturthi Utsav 2026",
    eventId: 1,
    year: 2026,
    dayLabel: "Grand Finale",
    category: "Highlights & Videos",
    type: "video",
    album: "Visarjan Highlights",
    uploader: "Media Team",
    dateStr: "Aug 30, 2026",
  },
  {
    id: 8,
    url: "https://images.unsplash.com/photo-1468971050039-be99497410af?w=800&q=80",
    title: "Garba Dandiya Raas Evening Highlights",
    eventName: "Navratri Garba & Cultural 2025",
    eventId: 3,
    year: 2025,
    dayLabel: "Day 2",
    category: "Cultural Stage",
    type: "video",
    album: "Garba Nights",
    uploader: "Cultural Desk",
    dateStr: "Oct 15, 2025",
  },
  {
    id: 9,
    url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    title: "Diwali Light Show & Fireworks Display",
    eventName: "Diwali Community Carnival 2025",
    eventId: 4,
    year: 2025,
    dayLabel: "Grand Finale",
    category: "Highlights & Videos",
    type: "photo",
    album: "Diwali Sparkle",
    uploader: "Youth Club",
    dateStr: "Nov 01, 2025",
  },
];

const DAY_OPTIONS = ["All Days", "Day 1", "Day 2", "Day 3", "Day 4", "Grand Finale"];
const CATEGORY_OPTIONS = ["All Media", "Puja & Rituals", "Cultural Stage", "Sports & Games", "Food & Feast", "Volunteers & Ops", "Highlights & Videos"];

// ─── default day tags shown when no DB records exist ────────────────────────
const DEFAULT_DAYS: EventDayResponse[] = [
  { id: -1, label: "Day 1", sortOrder: 0 },
  { id: -2, label: "Day 2", sortOrder: 1 },
  { id: -3, label: "Day 3", sortOrder: 2 },
  { id: -4, label: "Day 4", sortOrder: 3 },
  { id: -5, label: "Day 5", sortOrder: 4 },
];

const MOCK_ITEMS: EventGalleryItemResponse[] = [
  { id: 1, eventId: 1, url: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=400&q=80", thumbnailUrl: null, mediaType: "PHOTO", albumName: "Puja", dayTag: "Day 1", category: "Highlights", caption: "Morning Puja ceremony", featured: true,  sortOrder: 0, uploadedByName: "Admin", createdAt: "" },
  { id: 2, eventId: 1, url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80", thumbnailUrl: null, mediaType: "PHOTO", albumName: "Cultural", dayTag: "Day 1", category: "Cultural",    caption: "Dance performance",   featured: false, sortOrder: 1, uploadedByName: "Admin", createdAt: "" },
  { id: 3, eventId: 1, url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&q=80", thumbnailUrl: null, mediaType: "PHOTO", albumName: "Sports",  dayTag: "Day 2", category: "Sports",      caption: "Cricket finals",      featured: false, sortOrder: 2, uploadedByName: "Admin", createdAt: "" },
  { id: 4, eventId: 1, url: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80", thumbnailUrl: null, mediaType: "VIDEO", albumName: "Vol",     dayTag: "Day 2", category: "Volunteers",   caption: "Volunteers at work",  featured: false, sortOrder: 3, uploadedByName: "Admin", createdAt: "" },
  { id: 5, eventId: 1, url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80", thumbnailUrl: null, mediaType: "PHOTO", albumName: "Sponsors",dayTag: "Day 3", category: "Sponsors",    caption: "Sponsor stalls",      featured: false, sortOrder: 4, uploadedByName: "Admin", createdAt: "" },
  { id: 6, eventId: 1, url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80", thumbnailUrl: null, mediaType: "PHOTO", albumName: "Food",    dayTag: "Day 3", category: "Cultural",    caption: "Prasadam distribution",featured: false, sortOrder: 5, uploadedByName: "Admin", createdAt: "" },
];

// ─── Upload queue item ───────────────────────────────────────────────────────
interface QueueItem {
  key: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function GalleryImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}


function mapLivePhotos(data: EventGalleryItemResponse[]): GalleryItem[] {
  return data.map(g => ({
    id: g.id,
    url: g.thumbnailUrl ?? g.url,
    title: g.caption || g.albumName || `Media #${g.id}`,
    eventName: g.eventName || "Event",
    eventId: g.eventId,
    year: g.createdAt ? new Date(g.createdAt).getFullYear() : 2026,
    dayLabel: g.dayLabel || "Day 1",
    category: g.category || "General",
    type: (g.mediaType ?? "PHOTO").toLowerCase() === "video" ? "video" : "photo",
    album: g.albumName ?? "General Gallery",
    uploader: g.uploaderName || "Community Admin",
    dateStr: g.createdAt ? new Date(g.createdAt).toLocaleDateString() : undefined,
  }));
}

// ─── Create-tag inline form ───────────────────────────────────────────────────
function InlineCreate({ placeholder, onSave, onCancel }: {
  placeholder: string; onSave: (val: string) => Promise<void>; onCancel: () => void;
}) {
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  async function submit() {
    if (!val.trim()) return;
    setSaving(true);
    try { await onSave(val.trim()); } finally { setSaving(false); }
  }
  return (
    <span className="inline-flex items-center gap-1">
      <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
        placeholder={placeholder}
        className="h-6 text-xs px-2 border border-indigo-300 rounded-full outline-none focus:ring-1 focus:ring-indigo-400 w-24 dark:bg-slate-800 dark:text-white dark:border-indigo-600" />
      <button onClick={submit} disabled={saving || !val.trim()}
        className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-40">
        {saving ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
      </button>
      <button onClick={onCancel} className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// ─── Upload Drawer ────────────────────────────────────────────────────────────
function UploadDrawer({
  open, onClose, events, days, categories, onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  events: EventResponse[];
  days: EventDayResponse[];
  categories: EventMediaCategoryResponse[];
  onUploaded: (item: EventGalleryItemResponse) => void;
}) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [eventId, setEventId] = useState<number | "">("");
  const [dayTag, setDayTag] = useState("");
  const [category, setCategory] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset when drawer opens
  useEffect(() => {
    if (open) { setQueue([]); setEventId(events[0]?.id ?? ""); setDayTag(""); setCategory(""); setCaption(""); }
  }, [open, events]);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const items: QueueItem[] = arr.map(f => ({
      key: `${f.name}-${f.size}-${Date.now()}`,
      file: f,
      preview: URL.createObjectURL(f),
      status: "pending",
    }));
    setQueue(q => [...q, ...items]);
  }

  async function uploadAll() {
    if (!eventId || queue.length === 0) return;
    setUploading(true);
    for (const item of queue) {
      if (item.status === "done") continue;
      setQueue(q => q.map(i => i.key === item.key ? { ...i, status: "uploading" } : i));
      try {
        const uploaded = await fileUploadService.upload(item.file);
        const mediaType = item.file.type.startsWith("video/") ? "VIDEO" : "PHOTO";
        const galleryItem = await eventGalleryService.create({
          eventId: Number(eventId),
          url: uploaded.url,
          mediaType,
          dayTag: dayTag || undefined,
          category: category || undefined,
          caption: caption || undefined,
        });
        setQueue(q => q.map(i => i.key === item.key ? { ...i, status: "done" } : i));
        onUploaded(galleryItem);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        setQueue(q => q.map(i => i.key === item.key ? { ...i, status: "error", error: msg } : i));
      }
    }
    setUploading(false);
  }

  const canUpload = !!eventId && queue.some(i => i.status === "pending" || i.status === "error");

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose} />

      {/* Drawer */}
      <div className={`relative w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 dark:text-white">Upload Media</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
              ${dragOver ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}>
            <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden"
              onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
            <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Drop files here or click to browse</p>
            <p className="text-xs text-slate-400 mt-0.5">Images & Videos • Multiple files supported</p>
          </div>

          {/* Queue preview */}
          {queue.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {queue.map(item => (
                <div key={item.key} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 group">
                  {item.file.type.startsWith("video/") ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-slate-400" />
                    </div>
                  ) : (
                    <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
                  )}
                  <div className={`absolute inset-0 flex items-center justify-center
                    ${item.status === "uploading" ? "bg-black/30" : ""}
                    ${item.status === "done" ? "bg-green-500/30" : ""}
                    ${item.status === "error" ? "bg-rose-500/30" : ""}`}>
                    {item.status === "uploading" && <Loader2 className="w-5 h-5 text-white animate-spin" />}
                    {item.status === "done" && <CheckCircle2 className="w-5 h-5 text-white" />}
                    {item.status === "error" && <AlertCircle className="w-5 h-5 text-white" />}
                  </div>
                  {item.status === "pending" && (
                    <button onClick={() => setQueue(q => q.filter(i => i.key !== item.key))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-3">
            {/* Event */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Event *</label>
              <div className="relative">
                <select value={eventId} onChange={e => setEventId(Number(e.target.value))}
                  className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 dark:text-white appearance-none">
                  <option value="">— Select event —</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Day Tag */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Day Tag</label>
              <div className="relative">
                <select value={dayTag} onChange={e => setDayTag(e.target.value)}
                  className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 dark:text-white appearance-none">
                  <option value="">— None —</option>
                  {days.map(d => <option key={d.id} value={d.label}>{d.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Category</label>
              <div className="relative">
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 dark:text-white appearance-none">
                  <option value="">— None —</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Caption</label>
              <input value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Optional caption for all files..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 dark:text-white placeholder:text-slate-300" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={uploadAll} disabled={!canUpload || uploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm">
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload {queue.filter(i => i.status === "pending").length || ""}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function EventsGallery() {
  const { useMock } = useEventMock();

  // Data
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [days, setDays] = useState<EventDayResponse[]>([]);
  const [categories, setCategories] = useState<EventMediaCategoryResponse[]>([]);
  const [items, setItems] = useState<EventGalleryItemResponse[]>([]);

  // Multi-dimensional filter states
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedEventId, setSelectedEventId] = useState<string>("All");
  const [selectedDay, setSelectedDay] = useState<string>("All Days");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Media");
  const [activeDayTag, setActiveDayTag] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // UI
  const [view, setView] = useState<"grid" | "albums">("grid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Inline create state
  const [addingDay, setAddingDay] = useState(false);
  const [addingCat, setAddingCat] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<EventGalleryItemResponse | null>(null);

  // Deletion and Multi-Selection state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<number[] | null>(null);

  // Upload Modal Form State
  interface ModalFileQueueItem {
    key: string;
    file: File;
    preview: string;
    mediaType: "photo" | "video";
  }

  const [uploadForm, setUploadForm] = useState({
    title: "",
    eventName: "Ganesh Chaturthi Utsav 2026",
    year: 2026,
    dayLabel: "Day 1",
    category: "Puja & Rituals",
    type: "photo" as "photo" | "video",
    url: "",
    album: "General",
  });
  const [uploadFilesQueue, setUploadFilesQueue] = useState<ModalFileQueueItem[]>([]);
  const [uploadValidationErrors, setUploadValidationErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Inline creation states inside Upload Modal
  const [showAddDayInModal, setShowAddDayInModal] = useState(false);
  const [newDayLabel, setNewDayLabel] = useState("");
  const [showAddCatInModal, setShowAddCatInModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const handleUploadSubmit = async (e: React.FormEvent, isPublish: boolean = true) => {
    e.preventDefault();

    const rawUrls = uploadForm.url
      .split(/[\n,]/)
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (uploadFilesQueue.length === 0 && rawUrls.length === 0) return;
    setUploading(true);

    try {
      const createdItems: EventGalleryItemResponse[] = [];
      const evtIdNum = Number(selectedEventId) || events[0]?.id || 1;

      // 1. Process selected files queue
      for (let i = 0; i < uploadFilesQueue.length; i++) {
        const item = uploadFilesQueue[i];
        let finalUrl = item.preview;

        if (!useMock) {
          // 1. Upload to AWS S3 first and verify object persistence
          const res = await fileUploadService.upload(item.file);
          finalUrl = res.url;

          // 2. Only after S3 upload succeeds, save metadata details to PostgreSQL DB
          const created = await eventGalleryService.create({
            eventId: evtIdNum,
            url: finalUrl,
            thumbnailUrl: finalUrl,
            mediaType: item.mediaType === "video" ? "VIDEO" : "PHOTO",
            dayTag: uploadForm.dayLabel,
            category: uploadForm.category,
            caption: uploadForm.title.trim()
              ? (uploadFilesQueue.length === 1 && rawUrls.length === 0 ? uploadForm.title.trim() : `${uploadForm.title.trim()} #${i + 1}`)
              : item.file.name.replace(/\.[^/.]+$/, ""),
            albumName: uploadForm.album,
            featured: isPublish,
          });
          createdItems.push(created);
        } else {
          const newItem: EventGalleryItemResponse = {
            id: Date.now() + i,
            eventId: evtIdNum,
            eventName: uploadForm.eventName,
            url: finalUrl,
            thumbnailUrl: finalUrl,
            mediaType: item.mediaType === "video" ? "VIDEO" : "PHOTO",
            dayTag: uploadForm.dayLabel,
            category: uploadForm.category,
            caption: uploadForm.title.trim()
              ? (uploadFilesQueue.length === 1 && rawUrls.length === 0 ? uploadForm.title.trim() : `${uploadForm.title.trim()} #${i + 1}`)
              : item.file.name.replace(/\.[^/.]+$/, ""),
            albumName: uploadForm.album,
            uploadedByName: "Current Admin",
            createdAt: new Date().toISOString(),
            featured: isPublish,
            sortOrder: 0,
          };
          createdItems.push(newItem);
        }
      }

      // 2. Process URLs from textarea
      for (let idx = 0; idx < rawUrls.length; idx++) {
        const urlStr = rawUrls[idx];
        const isVideo = urlStr.includes(".mp4") || urlStr.includes(".webm") || urlStr.includes("video") || urlStr.includes("youtube") || urlStr.includes("vimeo");

        if (!useMock) {
          const created = await eventGalleryService.create({
            eventId: evtIdNum,
            url: urlStr,
            thumbnailUrl: urlStr,
            mediaType: isVideo ? "VIDEO" : "PHOTO",
            dayTag: uploadForm.dayLabel,
            category: uploadForm.category,
            caption: uploadForm.title.trim()
              ? (rawUrls.length === 1 && uploadFilesQueue.length === 0 ? uploadForm.title.trim() : `${uploadForm.title.trim()} URL #${idx + 1}`)
              : `Media URL #${idx + 1}`,
            albumName: uploadForm.album,
            featured: isPublish,
          });
          createdItems.push(created);
        } else {
          const newItem: EventGalleryItemResponse = {
            id: Date.now() + 1000 + idx,
            eventId: evtIdNum,
            eventName: uploadForm.eventName,
            url: urlStr,
            thumbnailUrl: urlStr,
            mediaType: isVideo ? "VIDEO" : "PHOTO",
            dayTag: uploadForm.dayLabel,
            category: uploadForm.category,
            caption: uploadForm.title.trim()
              ? (rawUrls.length === 1 && uploadFilesQueue.length === 0 ? uploadForm.title.trim() : `${uploadForm.title.trim()} URL #${idx + 1}`)
              : `Media URL #${idx + 1}`,
            albumName: uploadForm.album,
            uploadedByName: "Current Admin",
            createdAt: new Date().toISOString(),
            featured: isPublish,
            sortOrder: 0,
          };
          createdItems.push(newItem);
        }
      }

      setItems(prev => [...createdItems, ...prev]);
      setShowUploadModal(false);
      setUploadFilesQueue([]);
      setUploadForm({
        title: "",
        eventName: events[0]?.title || "Ganesh Chaturthi Utsav 2026",
        year: 2026,
        dayLabel: "Day 1",
        category: "Puja & Rituals",
        type: "photo",
        url: "",
        album: "General",
      });
      setError("");
      setSuccessMsg(`Media stored in AWS S3 and saved to PostgreSQL successfully! (${createdItems.length} items)`);
    } catch (err: any) {
      console.error("Failed to upload media:", err);
      let rawMsg = err?.response?.data?.message || err?.message || "Failed to store media in AWS S3 cloud storage.";
      if (rawMsg.includes("301") || rawMsg.includes("specified endpoint") || rawMsg.includes("PermanentRedirect")) {
        rawMsg = "Unable to save file to AWS S3: S3 bucket region misconfigured. Please check S3_REGION settings.";
      } else if (rawMsg.includes("AccessDenied") || rawMsg.includes("403") || rawMsg.includes("InvalidAccessKeyId")) {
        rawMsg = "Unable to save file to AWS S3: Access denied or invalid S3 storage credentials.";
      }
      setError(`⚠️ Media Upload Failed: ${rawMsg} — No records were saved to database.`);
    } finally {
      setUploading(false);
    }
  };

  // Extract available years dynamically from dataset
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(items.map(i => i.createdAt ? new Date(i.createdAt).getFullYear() : 2026))).sort((a, b) => b - a);
    return ["All", ...years.map(String)];
  }, [items]);

  // Extract available events dynamically
  const availableEvents = useMemo(() => {
    if (useMock) return MOCK_EVENTS_LIST;
    return events.map(e => ({ id: e.id, title: e.title, year: new Date(e.startDate).getFullYear() }));
  }, [useMock, events]);

  // Dynamically derive available days
  const dynamicDayOptions = useMemo(() => {
    const set = new Set<string>();
    days.forEach(d => set.add(d.label));
    items.forEach(i => { if (i.dayTag) set.add(i.dayTag); });
    if (set.size === 0) return ["All Days", "Day 1", "Day 2", "Day 3", "Day 4", "Grand Finale"];
    const sorted = Array.from(set).sort((a, b) => {
      if (a === "Grand Finale") return 1;
      if (b === "Grand Finale") return -1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
    return ["All Days", ...sorted];
  }, [days, items]);

  // Dynamically derive available categories
  const dynamicCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    categories.forEach(c => set.add(c.name));
    items.forEach(i => { if (i.category) set.add(i.category); });
    if (set.size === 0) return ["All Media", "Puja & Rituals", "Cultural Stage", "Sports & Games", "Food & Feast", "Volunteers & Ops", "Highlights & Videos"];
    const sorted = Array.from(set).sort();
    return ["All Media", ...sorted];
  }, [categories, items]);

  // ── Fetch bootstrap data ─────────────────────────────────────────────────
  useEffect(() => {
    if (useMock) {
      setItems(MOCK_ITEMS);
      setDays(DEFAULT_DAYS);
      setCategories([
        { id: 1, name: "Highlights", sortOrder: 0 },
        { id: 2, name: "Cultural",   sortOrder: 1 },
        { id: 3, name: "Sports",     sortOrder: 2 },
        { id: 4, name: "Volunteers", sortOrder: 3 },
        { id: 5, name: "Sponsors",   sortOrder: 4 },
      ]);
      return;
    }
    setLoading(true);
    setError("");
    Promise.allSettled([
      eventService.getAllEvents(),
      eventDayService.getAll(),
      eventMediaCategoryService.getAll(),
      eventGalleryService.getByCommunity(),
    ]).then(([evtR, daysR, catsR, itemsR]) => {
      if (evtR.status === "fulfilled") {
        setEvents(evtR.value);
        if (evtR.value.length > 0) setSelectedEventId("All");
      }
      if (daysR.status === "fulfilled") {
        setDays(daysR.value.length > 0 ? daysR.value : DEFAULT_DAYS);
      } else {
        setDays(DEFAULT_DAYS);
      }
      if (catsR.status === "fulfilled") setCategories(catsR.value);
      if (itemsR.status === "fulfilled") setItems(itemsR.value);
      const anyFailed = [evtR, daysR, catsR, itemsR].some(r => r.status === "rejected");
      if (anyFailed) setError("Some data could not be loaded.");
    }).finally(() => setLoading(false));
  }, [useMock]);

  // ── Re-fetch gallery when day/category filter changes (live mode) ─────────
  useEffect(() => {
    if (useMock) return;
    eventGalleryService.getByCommunity({
      dayTag: activeDayTag ?? undefined,
      category: activeCategory ?? undefined,
    }).then(setItems).catch(() => {});
  }, [useMock, activeDayTag, activeCategory]);

  // ── Create day tag ────────────────────────────────────────────────────────
  const handleCreateDay = useCallback(async (label: string) => {
    if (useMock) {
      const pseudo: EventDayResponse = { id: -(Date.now()), label, sortOrder: days.length };
      setDays(d => [...d, pseudo]);
      setAddingDay(false);
      return;
    }
    const created = await eventDayService.create({ label });
    setDays(d => [...d, created]);
    setAddingDay(false);
  }, [useMock, days.length]);

  // ── Create category ────────────────────────────────────────────────────────
  const handleCreateCategory = useCallback(async (name: string) => {
    if (useMock) {
      const pseudo: EventMediaCategoryResponse = { id: -(Date.now()), name, sortOrder: categories.length };
      setCategories(c => [...c, pseudo]);
      setAddingCat(false);
      return;
    }
    const created = await eventMediaCategoryService.create({ name });
    setCategories(c => [...c, created]);
    setAddingCat(false);
  }, [useMock, categories.length]);

  // ── Delete day tag ─────────────────────────────────────────────────────────
  async function deleteDay(d: EventDayResponse) {
    if (d.id < 0) { setDays(ds => ds.filter(x => x.id !== d.id)); return; }
    await eventDayService.deleteDay(d.id);
    setDays(ds => ds.filter(x => x.id !== d.id));
    if (activeDayTag === d.label) setActiveDayTag(null);
  }

  // ── Delete category ────────────────────────────────────────────────────────
  async function deleteCategory(c: EventMediaCategoryResponse) {
    if (c.id < 0) { setCategories(cs => cs.filter(x => x.id !== c.id)); return; }
    await eventMediaCategoryService.deleteCategory(c.id);
    setCategories(cs => cs.filter(x => x.id !== c.id));
    if (activeCategory === c.name) setActiveCategory(null);
  }

  // ── Single and Bulk Media Deletion ──────────────────────────────────────
  const toggleSelectItem = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllFilteredItems = (itemsToSelect: EventGalleryItemResponse[]) => {
    const allFilteredIds = itemsToSelect.map(item => item.id);
    if (selectedIds.length === allFilteredIds.length && allFilteredIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  const handleExecuteDelete = async (ids: number[]) => {
    if (ids.length === 0) return;
    setDeleting(true);
    setError("");

    try {
      if (!useMock) {
        for (const id of ids) {
          try {
            await eventGalleryService.deleteItem(id);
          } catch (e: any) {
            console.warn(`Error deleting gallery item ${id}:`, e);
          }
        }
      }
      setItems(prev => prev.filter(item => !ids.includes(item.id)));
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));

      if (activeLightbox && ids.includes(activeLightbox.id)) {
        setActiveLightbox(null);
      }
      setDeleteConfirmTarget(null);
    } catch (e: any) {
      setError(e.message ?? "Failed to delete selected media items.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Filter items for the current view ────────────────────────────────────
  const filteredItems = items.filter(item => {
    if (selectedYear !== "All" && item.createdAt && String(new Date(item.createdAt).getFullYear()) !== selectedYear) return false;
    if (selectedEventId !== "All" && String(item.eventId) !== selectedEventId) return false;
    if (selectedDay !== "All Days" && item.dayTag !== selectedDay) return false;
    if (activeDayTag && item.dayTag !== activeDayTag) return false;
    if (selectedCategory !== "All Media") {
      if (selectedCategory === "Highlights & Videos" && item.mediaType === "VIDEO") return true;
      if (item.category !== selectedCategory) return false;
    }
    if (activeCategory && item.category !== activeCategory) return false;
    return true;
  });

  // Build album groups from filtered items
  const albumMap = new Map<string, EventGalleryItemResponse[]>();
  for (const item of filteredItems) {
    const key = item.albumName ?? item.category ?? item.dayTag ?? "Uncategorized";
    if (!albumMap.has(key)) albumMap.set(key, []);
    albumMap.get(key)!.push(item);
  }
  const albumGroups = Array.from(albumMap.entries()).map(([name, groupItems]) => ({
    name,
    count: groupItems.length,
    cover: groupItems[0]?.url,
    items: groupItems
  }));

  return (
    <div className="space-y-4">
      {/* ── Success banner ───────────────────────────────────────────────── */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && <ErrorBanner message={error} variant="warning" />}

      {/* ── Top Header Bar & Multi-dimensional Controls ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-600" /> Event Media & Memories
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing <span className="font-bold text-indigo-600">{filteredItems.length}</span> items across events & days
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Multi-select Actions Bar */}
            {isSelectMode ? (
              <>
                <button
                  onClick={() => selectAllFilteredItems(filteredItems)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? "Deselect All" : "Select All"}
                </button>
                <button
                  onClick={() => setDeleteConfirmTarget(selectedIds)}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 transition-all shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.length})
                </button>
                <button
                  onClick={() => { setIsSelectMode(false); setSelectedIds([]); }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsSelectMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" /> Select Items
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-0.5">
              <button
                onClick={() => setView("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  view === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" /> Media Grid
              </button>
              <button
                onClick={() => setView("albums")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  view === "albums" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Albums
              </button>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Media
            </button>
          </div>
        </div>

        {/* ── Dropdown Filters (Year & Event Selection) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Year Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-500" /> Filter Year
            </label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 text-slate-700"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y === "All" ? "🗓️ All Years" : `Year ${y}`}</option>
              ))}
            </select>
          </div>

          {/* Event Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-500" /> Filter Event
            </label>
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 text-slate-700"
            >
              <option value="All">🎉 All Community Events</option>
              {availableEvents.map(ev => (
                <option key={ev.id} value={String(ev.id)}>{ev.title}</option>
              ))}
            </select>
          </div>

          {/* Day Filter dropdown - shown only when Year & Event are selected */}
          {selectedYear !== "All" && selectedEventId !== "All" && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-indigo-500" /> Active Day Filter
              </label>
              <select
                value={selectedDay}
                onChange={e => setSelectedDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 text-slate-700"
              >
                {dynamicDayOptions.map(d => (
                  <option key={d} value={d}>{d === "All Days" ? "📅 All Days (Multi-day)" : `📌 ${d}`}</option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedYear("All");
                setSelectedEventId("All");
                setSelectedDay("All Days");
                setSelectedCategory("All Media");
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        </div>

        {/* ── Day-wise Chips & Category Pill Bar (shown ONLY when both Year and Event are selected) ── */}
        {selectedYear !== "All" && selectedEventId !== "All" ? (
          <div className="space-y-2 pt-2 border-t border-slate-100 animate-fade-in">
            {/* Day Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Day:</span>
              {dynamicDayOptions.map(day => {
                const active = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 border ${
                      active
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Category:</span>
              {dynamicCategoryOptions.map(cat => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 border ${
                      active
                        ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
            <span>💡 Select a specific <strong className="text-slate-700 dark:text-slate-300">Year</strong> and <strong className="text-slate-700 dark:text-slate-300">Event</strong> above to reveal Day-wise and Category-wise filters.</span>
          </div>
        )}
      </div>

      {/* ── Loading Spinner ── */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-500" /> Loading event media...
        </div>
      )}

      {/* ── Media Content View ── */}
      {!loading && filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No media found for the selected filters</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try switching year, event, day, or category filters to view other uploaded memories.
          </p>
        </div>
      ) : view === "grid" ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredItems.map(item => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isSelectMode) {
                    toggleSelectItem(item.id);
                  } else {
                    setActiveLightbox(item);
                  }
                }}
                className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 group cursor-pointer flex flex-col relative ${
                  isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-md scale-[0.98]"
                    : "border-slate-100 shadow-sm hover:shadow-xl"
                }`}
              >
                {/* Single Delete Button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setDeleteConfirmTarget([item.id]);
                  }}
                  title="Delete media item"
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-700 transition-all shadow-md z-20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Selection Checkbox overlay */}
                {isSelectMode && (
                  <div className="absolute top-2 left-2 z-20">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.id)}
                      onClick={e => e.stopPropagation()}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                  </div>
                )}

                <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                  <GalleryImage
                    src={item.url}
                    alt={item.caption || item.eventName || "Event Image"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Day & Category Badges */}
                  <div className={`absolute top-2 ${isSelectMode ? "left-8" : "left-2"} flex items-center gap-1.5 flex-wrap transition-all`}>
                    {item.dayTag && (
                      <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                        {item.dayTag}
                      </span>
                    )}
                    {item.category && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold">
                        {item.category}
                      </span>
                    )}
                  </div>

                {/* Media Type Icon */}
                {item.mediaType === "VIDEO" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 text-indigo-600 ml-0.5" />
                    </div>
                  </div>
                )}

                {/* Year Tag */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/50 text-white font-mono text-[9px]">
                  {item.createdAt ? new Date(item.createdAt).getFullYear() : 2026}
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {item.caption || item.eventName || "Event Media"}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.eventName}</p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  <span>{item.albumName || "General"}</span>
                  <span>{item.createdAt ? item.createdAt.substring(0, 10) : "2026"}</span>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        /* ── Albums View ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {albumGroups.map(alb => (
            <div
              key={alb.name}
              onClick={() => {
                setSelectedCategory(alb.items[0]?.category || "All Media");
                setView("grid");
              }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
            >
              <div className="relative h-44 overflow-hidden bg-slate-100">
                {alb.cover ? (
                  <GalleryImage src={alb.cover} alt={alb.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold">
                  {alb.count} Items
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-extrabold text-base leading-tight">{alb.name}</p>
                  <p className="text-white/70 text-xs mt-0.5 truncate">{alb.items[0]?.eventName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lightbox Preview Modal ── */}
      {activeLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={e => { if (e.target === e.currentTarget) setActiveLightbox(null); }}
        >
          <div className="bg-slate-900 rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl border border-slate-800 flex flex-col md:flex-row max-h-[90vh]">
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px]">
              <GalleryImage
                src={activeLightbox.url}
                alt={activeLightbox.caption || activeLightbox.eventName || "Preview"}
                className="max-h-[70vh] w-full object-contain"
              />
              {activeLightbox.mediaType === "VIDEO" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                    <Play className="w-8 h-8 ml-1" />
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-80 p-6 bg-slate-900 text-white flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    {activeLightbox.dayTag || "Day 1"} • {activeLightbox.category || "General"}
                  </span>
                  <button
                    onClick={() => setActiveLightbox(null)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-white">{activeLightbox.caption || activeLightbox.eventName}</h3>
                  <p className="text-xs text-indigo-400 mt-1">{activeLightbox.eventName} ({activeLightbox.createdAt ? new Date(activeLightbox.createdAt).getFullYear() : 2026})</p>
                </div>

                <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
                  <div className="flex justify-between">
                    <span>Album:</span>
                    <span className="text-slate-200 font-medium">{activeLightbox.albumName || "General"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded By:</span>
                    <span className="text-slate-200 font-medium">{activeLightbox.uploadedByName || "Admin"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="text-slate-200 font-medium">{activeLightbox.createdAt ? activeLightbox.createdAt.substring(0, 10) : "2026"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex gap-2">
                <a
                  href={activeLightbox.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  onClick={() => setDeleteConfirmTarget([activeLightbox.id])}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-rose-500/30"
                  title="Delete this media item"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Upload New Media Modal Popup ── */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) setShowUploadModal(false); }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Upload Event Media & Memories
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Media Title / Caption *</label>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-indigo-200 outline-none"
                  placeholder="e.g. Visarjan Procession Evening Dance"
                  value={uploadForm.title}
                  onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))}
                  required
                />

              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Event *</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-xs font-medium"
                    value={uploadForm.eventName}
                    onChange={e => setUploadForm(f => ({ ...f, eventName: e.target.value }))}
                  >
                    {(!useMock && events.length > 0
                      ? events.map(ev => ({ id: ev.id, title: ev.title }))
                      : availableEvents
                    ).map(ev => (
                      <option key={ev.id} value={ev.title}>{ev.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Year</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-xs font-medium"
                    value={uploadForm.year}
                    onChange={e => setUploadForm(f => ({ ...f, year: Number(e.target.value) }))}
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Day Tag Dropdown with + Add Day Button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Day Tag</label>
                    <button
                      type="button"
                      onClick={() => setShowAddDayInModal(true)}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add Day
                    </button>
                  </div>
                  {showAddDayInModal ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="e.g. Day 6"
                        value={newDayLabel}
                        onChange={e => setNewDayLabel(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-600 text-xs outline-none bg-white dark:bg-slate-800 dark:text-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newDayLabel.trim()) return;
                          await handleCreateDay(newDayLabel.trim());
                          setUploadForm(f => ({ ...f, dayLabel: newDayLabel.trim() }));
                          setNewDayLabel("");
                          setShowAddDayInModal(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shrink-0 hover:bg-indigo-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddDayInModal(false)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-xs font-medium"
                      value={uploadForm.dayLabel}
                      onChange={e => setUploadForm(f => ({ ...f, dayLabel: e.target.value }))}
                    >
                      {(days.length > 0 ? days.map(d => d.label) : ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Grand Finale"]).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Category Dropdown with + Add Category Button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Category</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCatInModal(true)}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add Category
                    </button>
                  </div>
                  {showAddCatInModal ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="e.g. Decoration"
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-600 text-xs outline-none bg-white dark:bg-slate-800 dark:text-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newCatName.trim()) return;
                          await handleCreateCategory(newCatName.trim());
                          setUploadForm(f => ({ ...f, category: newCatName.trim() }));
                          setNewCatName("");
                          setShowAddCatInModal(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shrink-0 hover:bg-indigo-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddCatInModal(false)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-xs font-medium"
                      value={uploadForm.category}
                      onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))}
                    >
                      {(categories.length > 0 ? categories.map(c => c.name) : ["Puja & Rituals", "Cultural Stage", "Sports & Games", "Food & Feast", "Volunteers & Ops", "Highlights & Videos"]).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Media Type</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-xs"
                    value={uploadForm.type}
                    onChange={e => setUploadForm(f => ({ ...f, type: e.target.value as "photo" | "video" }))}
                  >
                    <option value="photo">🖼️ Image / Photo</option>
                    <option value="video">🎥 Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Album Name</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-xs"
                    placeholder="General Album"
                    value={uploadForm.album}
                    onChange={e => setUploadForm(f => ({ ...f, album: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Upload Multiple Images & Videos or URLs *
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const files = Array.from(e.target.files);
                        const validItems: ModalFileQueueItem[] = [];
                        const errors: string[] = [];

                        for (const f of files) {
                          const result = await validateMediaFile(f);
                          if (result.valid) {
                            validItems.push({
                              key: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
                              file: f,
                              preview: URL.createObjectURL(f),
                              mediaType: result.mediaType === "video" ? "video" : "photo",
                            });
                          } else if (result.error) {
                            errors.push(result.error);
                          }
                        }

                        if (validItems.length > 0) {
                          setUploadFilesQueue(prev => [...prev, ...validItems]);
                        }
                        if (errors.length > 0) {
                          setUploadValidationErrors(errors);
                        } else {
                          setUploadValidationErrors([]);
                        }
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                  />

                  {uploadValidationErrors.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-900 dark:text-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Validation Warnings ({uploadValidationErrors.length})
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] font-medium">
                        {uploadValidationErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {uploadFilesQueue.length > 0 && (
                    <div className="space-y-1.5 animate-fade-in">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>Selected Files ({uploadFilesQueue.length})</span>
                        <button
                          type="button"
                          onClick={() => setUploadFilesQueue([])}
                          className="text-rose-500 hover:underline"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        {uploadFilesQueue.map((item, idx) => (
                          <div key={item.key} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/10">
                            {item.mediaType === "video" ? (
                              <video src={item.preview} className="w-full h-full object-cover" />
                            ) : (
                              <img src={item.preview} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                            )}
                            <button
                              type="button"
                              onClick={() => setUploadFilesQueue(q => q.filter(x => x.key !== item.key))}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 hover:bg-rose-600 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[8px] font-bold">
                              {item.mediaType === "video" ? "🎥 Video" : "🖼️ Image"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="relative flex items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 bg-white dark:bg-slate-900 absolute left-1/2 -translate-x-1/2">
                      or paste image / video URLs
                    </span>
                    <hr className="w-full border-slate-100 dark:border-slate-800" />
                  </div>

                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                    placeholder="https://images.unsplash.com/... (Multiple URLs separated by lines or commas)"
                    value={uploadForm.url}
                    onChange={e => setUploadForm(f => ({ ...f, url: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFilesQueue([]);
                  }}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={uploading || (uploadFilesQueue.length === 0 && !uploadForm.url.trim())}
                  onClick={e => handleUploadSubmit(e, false)}
                  className="flex-1 px-3 py-2.5 rounded-xl text-xs font-bold border border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>

                <button
                  type="button"
                  disabled={uploading || (uploadFilesQueue.length === 0 && !uploadForm.url.trim())}
                  onClick={e => handleUploadSubmit(e, true)}
                  className="flex-1 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Upload drawer ─────────────────────────────────────────────────── */}
      <UploadDrawer
        open={showUpload}
        onClose={() => setShowUpload(false)}
        events={events}
        days={days}
        categories={categories}
        onUploaded={item => {
          setItems(its => [item, ...its]);
        }}
      />

      {/* ── Delete Confirmation Modal Popup ── */}
      {deleteConfirmTarget && deleteConfirmTarget.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                {deleteConfirmTarget.length === 1 ? "Delete Media Item?" : `Delete ${deleteConfirmTarget.length} Selected Media Items?`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete {deleteConfirmTarget.length === 1 ? "this media item" : `these ${deleteConfirmTarget.length} items`}? This action will permanently remove the files from S3 storage and gallery.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteDelete(deleteConfirmTarget)}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function MediaTile({ item, index, onDelete, useMock }: {
  item: EventGalleryItemResponse; index: number;
  onDelete: (id: number) => void; useMock: boolean;
}) {
  async function handleDelete() {
    if (!useMock) {
      try { await eventGalleryService.deleteItem(item.id); } catch { return; }
    }
    onDelete(item.id);
  }
  return (
    <div className={`relative rounded-xl overflow-hidden group cursor-pointer bg-slate-100 dark:bg-slate-800 aspect-square
      animate-fade-in-up stagger-${Math.min(index + 1, 8)}`}>
      <GalleryImage src={item.thumbnailUrl ?? item.url} alt={item.caption ?? ""} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
      {item.mediaType === "VIDEO" && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-slate-800 ml-0.5" />
          </div>
        </div>
      )}
      {item.featured && (
        <div className="absolute top-2 left-2">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        </div>
      )}
      {/* Hover overlay with meta */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-200">
        {item.dayTag && <span className="inline-block text-[9px] font-bold text-white/80 bg-white/20 rounded px-1.5 py-0.5 mr-1">{item.dayTag}</span>}
        {item.category && <span className="inline-block text-[9px] font-bold text-white/80 bg-white/20 rounded px-1.5 py-0.5">{item.category}</span>}
        {item.caption && <p className="text-[10px] text-white/90 mt-0.5 truncate">{item.caption}</p>}
      </div>
      {/* Delete */}
      <button onClick={handleDelete}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function AlbumCard({ name, items }: { name: string; items: EventGalleryItemResponse[] }) {
  const cover = items.find(i => i.featured) ?? items[0];
  const featured = !!items.find(i => i.featured);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
      <div className="relative h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
        {cover ? (
          <GalleryImage src={cover.thumbnailUrl ?? cover.url} alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-slate-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold">
            <Star className="w-2.5 h-2.5" /> Featured
          </div>
        )}
        <div className="absolute bottom-2 left-3">
          <p className="text-white font-bold text-sm">{name}</p>
          <p className="text-white/70 text-[10px]">{items.length} item{items.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
    </div>
  );
}

function UploadTile({ onUpload }: { onUpload: () => void }) {
  return (
    <button onClick={onUpload}
      className="aspect-square border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group">
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 flex items-center justify-center transition-all">
        <Plus className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
      </div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">Upload</p>
    </button>
  );
}

