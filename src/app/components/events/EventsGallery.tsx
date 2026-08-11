import { useState, useEffect, useCallback, useRef } from "react";
import {
  ImageIcon, Play, Upload, Grid3X3, List, Star,
  Plus, X, Trash2, Tag, Layers, CalendarDays, CheckCircle2, ChevronDown, Loader2, AlertCircle,
} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { FilterChip, FilterChipRow, ErrorBanner, LoadingSpinner, EmptyState } from "./shared";
import { eventGalleryService, type EventGalleryItemResponse } from "../../../services/events/eventGalleryService";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { eventDayService, type EventDayResponse } from "../../../services/events/eventDayService";
import { eventMediaCategoryService, type EventMediaCategoryResponse } from "../../../services/events/eventMediaCategoryService";
import { fileUploadService } from "../../../services/files/fileUploadService";

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
  if (failed) return (
    <div className={`${className ?? ""} flex items-center justify-center bg-slate-100 dark:bg-slate-800`}>
      <ImageIcon className="w-6 h-6 text-slate-300" />
    </div>
  );
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
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

  // Filters
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [activeDayTag, setActiveDayTag] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // UI
  const [view, setView] = useState<"grid" | "albums">("grid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  // Inline create state
  const [addingDay, setAddingDay] = useState(false);
  const [addingCat, setAddingCat] = useState(false);

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
        if (evtR.value.length > 0) setSelectedEventId(evtR.value[0].id);
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

  // ── Filter items for the current view ────────────────────────────────────
  const filteredItems = items.filter(item => {
    if (selectedEventId && item.eventId !== selectedEventId) return false;
    if (activeDayTag && item.dayTag !== activeDayTag) return false;
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

  return (
    <div className="space-y-4">
      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && <ErrorBanner message={error} variant="warning" />}

      {/* ── Event selector ───────────────────────────────────────────────── */}
      {!useMock && events.length > 0 && (
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedEventId ?? ""}
              onChange={e => setSelectedEventId(Number(e.target.value))}
              className="w-full px-3 py-1.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 dark:text-white appearance-none">
              <option value="">All Events</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* ── Day tags ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Day Tags</span>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <FilterChip label="All Days" active={activeDayTag === null} onSelect={() => setActiveDayTag(null)}
            count={items.length} />
          {days.map(d => (
            <FilterChip
              key={d.id}
              label={d.label}
              active={activeDayTag === d.label}
              count={items.filter(i => i.dayTag === d.label).length}
              onSelect={() => setActiveDayTag(activeDayTag === d.label ? null : d.label)}
              onRemove={!useMock ? () => deleteDay(d) : undefined}
            />
          ))}
          {!useMock && !addingDay && (
            <button onClick={() => setAddingDay(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-600 text-xs text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
              <Plus className="w-3 h-3" /> Add Day
            </button>
          )}
          {addingDay && (
            <InlineCreate placeholder="Day label" onSave={handleCreateDay} onCancel={() => setAddingDay(false)} />
          )}
        </div>
      </div>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Categories</span>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <FilterChip label="All" active={activeCategory === null} onSelect={() => setActiveCategory(null)} />
          {categories.map(c => (
            <FilterChip
              key={c.id}
              label={c.name}
              active={activeCategory === c.name}
              count={items.filter(i => i.category === c.name).length}
              onSelect={() => setActiveCategory(activeCategory === c.name ? null : c.name)}
              onRemove={!useMock ? () => deleteCategory(c) : undefined}
            />
          ))}
          {!useMock && !addingCat && (
            <button onClick={() => setAddingCat(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-600 text-xs text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
              <Plus className="w-3 h-3" /> Add Category
            </button>
          )}
          {addingCat && (
            <InlineCreate placeholder="Category name" onSave={handleCreateCategory} onCancel={() => setAddingCat(false)} />
          )}
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">
            {activeDayTag ?? activeCategory ?? "All Media"}
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
            {(activeDayTag || activeCategory) ? " matching filters" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {(["grid", "albums"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all capitalize
                  ${view === v ? "bg-indigo-500 text-white" : "bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600"}`}>
                {v === "grid" ? <Grid3X3 className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                {v}
              </button>
            ))}
          </div>
          {/* Upload button */}
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm">
            <Upload className="w-3.5 h-3.5" /> Upload Media
          </button>
        </div>
      </div>

      {/* ── Loading spinner ───────────────────────────────────────────────── */}
      {loading && <LoadingSpinner label="Loading gallery…" />}

      {/* ── Grid view ────────────────────────────────────────────────────── */}
      {!loading && view === "grid" && (
        filteredItems.length === 0 ? (
          <EmptyState icon={<ImageIcon className="w-8 h-8 text-slate-300" />} label="No media yet" sub="Upload photos and videos to build your gallery" action="Upload Media" onAction={() => setShowUpload(true)} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {filteredItems.map((item, i) => (
              <MediaTile key={item.id} item={item} index={i} onDelete={id => setItems(its => its.filter(x => x.id !== id))} useMock={useMock} />
            ))}
            <UploadTile onUpload={() => setShowUpload(true)} />
          </div>
        )
      )}

      {/* ── Albums view ───────────────────────────────────────────────────── */}
      {!loading && view === "albums" && (
        albumMap.size === 0 ? (
          <EmptyState icon={<ImageIcon className="w-8 h-8 text-slate-300" />} label="No media yet" sub="Upload photos and videos to build your gallery" action="Upload Media" onAction={() => setShowUpload(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(albumMap.entries()).map(([name, albumItems]) => (
              <AlbumCard key={name} name={name} items={albumItems} />
            ))}
            <button onClick={() => setShowUpload(true)}
              className="min-h-[200px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 flex items-center justify-center transition-all">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">Upload to new album</p>
            </button>
          </div>
        )
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
          // keep drawer open so user can upload more
        }}
      />
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

