import { useState, useEffect, useMemo } from "react";
import {
  ImageIcon, Play, Upload, Grid3X3, List, Star, Loader2, AlertCircle,
  Calendar, Filter, X, ChevronRight, Download, Share2, Layers, Tag, Film, CheckCircle2,
} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { eventGalleryService, type EventGalleryItemResponse } from "../../../services/events/eventGalleryService";
import { eventService, type EventResponse } from "../../../services/events/eventService";

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

function GalleryImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`${className ?? ""} flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 p-4 text-center`}>
        <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
        <span className="text-[10px] font-semibold">Image unavailable</span>
      </div>
    );
  }
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

export function EventsGallery() {
  const { useMock } = useEventMock();
  const [view, setView] = useState<"albums" | "grid">("grid");

  // Multi-dimensional filter states
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedEventId, setSelectedEventId] = useState<string>("All");
  const [selectedDay, setSelectedDay] = useState<string>("All Days");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Media");

  // Data & Modal states
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [liveItems, setLiveItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeLightbox, setActiveLightbox] = useState<GalleryItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // New item upload state
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
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (useMock) return;
    eventService.getUpcomingEvents()
      .then(evts => setEvents(evts))
      .catch(() => {});
  }, [useMock]);

  useEffect(() => {
    if (useMock) return;
    setLoading(true);
    setError("");
    const evtIdNum = selectedEventId !== "All" ? Number(selectedEventId) : undefined;
    eventGalleryService.getByEvent(evtIdNum || 1)
      .then(items => setLiveItems(mapLivePhotos(items)))
      .catch(e => setError(e.message ?? "Failed to load gallery"))
      .finally(() => setLoading(false));
  }, [useMock, selectedEventId]);

  const allItems = useMock ? MOCK_GALLERY_ITEMS : liveItems;

  // Extract available years dynamically from dataset
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(allItems.map(i => i.year))).sort((a, b) => b - a);
    return ["All", ...years.map(String)];
  }, [allItems]);

  // Extract available events dynamically
  const availableEvents = useMemo(() => {
    if (useMock) return MOCK_EVENTS_LIST;
    return events.map(e => ({ id: e.id, title: e.title, year: new Date(e.startDate).getFullYear() }));
  }, [useMock, events]);

  // Dynamically derive available days for the currently selected event and year
  const dynamicDayOptions = useMemo(() => {
    const daysSet = new Set<string>();

    allItems.forEach(item => {
      const matchYear = selectedYear === "All" || String(item.year) === selectedYear;
      const matchEvent = selectedEventId === "All" || String(item.eventId) === selectedEventId || item.eventName === selectedEventId;
      if (matchYear && matchEvent && item.dayLabel) {
        daysSet.add(item.dayLabel);
      }
    });

    if (daysSet.size === 0) {
      return ["All Days", "Day 1", "Day 2", "Day 3", "Day 4", "Grand Finale"];
    }

    const sortedDays = Array.from(daysSet).sort((a, b) => {
      if (a === "Grand Finale") return 1;
      if (b === "Grand Finale") return -1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    return ["All Days", ...sortedDays];
  }, [allItems, selectedYear, selectedEventId]);

  // Dynamically derive available categories from dataset & user uploads
  const dynamicCategoryOptions = useMemo(() => {
    const catSet = new Set<string>();

    allItems.forEach(item => {
      const matchYear = selectedYear === "All" || String(item.year) === selectedYear;
      const matchEvent = selectedEventId === "All" || String(item.eventId) === selectedEventId || item.eventName === selectedEventId;
      if (matchYear && matchEvent && item.category) {
        catSet.add(item.category);
      }
    });

    if (catSet.size === 0) {
      return ["All Media", "Puja & Rituals", "Cultural Stage", "Sports & Games", "Food & Feast", "Volunteers & Ops", "Highlights & Videos"];
    }

    const sortedCats = Array.from(catSet).sort();
    return ["All Media", ...sortedCats];
  }, [allItems, selectedYear, selectedEventId]);

  // Filter items based on selected Year, Event, Day, and Category
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      if (selectedYear !== "All" && String(item.year) !== selectedYear) return false;
      if (selectedEventId !== "All" && String(item.eventId) !== selectedEventId && item.eventName !== selectedEventId) return false;
      if (selectedDay !== "All Days" && item.dayLabel !== selectedDay) return false;
      if (selectedCategory !== "All Media") {
        if (selectedCategory === "Highlights & Videos" && item.type === "video") return true;
        if (item.category !== selectedCategory) return false;
      }
      return true;
    });
  }, [allItems, selectedYear, selectedEventId, selectedDay, selectedCategory]);

  // Group items by Albums for Album view
  const albumGroups = useMemo(() => {
    const map: Record<string, GalleryItem[]> = {};
    filteredItems.forEach(item => {
      const albName = item.album || "General Album";
      if (!map[albName]) map[albName] = [];
      map[albName].push(item);
    });
    return Object.entries(map).map(([name, items]) => ({
      name,
      count: items.length,
      cover: items[0]?.url,
      items,
    }));
  }, [filteredItems]);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim() || !uploadForm.url.trim()) return;
    setUploading(true);
    setTimeout(() => {
      const newItem: GalleryItem = {
        id: Date.now(),
        url: uploadForm.url.trim(),
        title: uploadForm.title.trim(),
        eventName: uploadForm.eventName,
        year: Number(uploadForm.year),
        dayLabel: uploadForm.dayLabel,
        category: uploadForm.category,
        type: uploadForm.type,
        album: uploadForm.album,
        uploader: "Current Admin",
        dateStr: "Just now",
      };
      if (useMock) {
        MOCK_GALLERY_ITEMS.unshift(newItem);
      } else {
        setLiveItems(prev => [newItem, ...prev]);
      }
      setUploading(false);
      setShowUploadModal(false);
      setUploadForm({
        title: "",
        eventName: "Ganesh Chaturthi Utsav 2026",
        year: 2026,
        dayLabel: "Day 1",
        category: "Puja & Rituals",
        type: "photo",
        url: "",
        album: "General",
      });
    }, 450);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

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

          <div className="flex items-center gap-2">
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

          {/* Day Filter dropdown/status indicator */}
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

        {/* ── Day-wise Chips & Category Pill Bar ── */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
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
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => setActiveLightbox(item)}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                <GalleryImage
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Day & Category Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                    {item.dayLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold">
                    {item.category}
                  </span>
                </div>

                {/* Media Type Icon */}
                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 text-indigo-600 ml-0.5" />
                    </div>
                  </div>
                )}

                {/* Year Tag */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/50 text-white font-mono text-[9px]">
                  {item.year}
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.eventName}</p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  <span>{item.album}</span>
                  <span>{item.dateStr || "2026"}</span>
                </div>
              </div>
            </div>
          ))}
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
                alt={activeLightbox.title}
                className="max-h-[70vh] w-full object-contain"
              />
              {activeLightbox.type === "video" && (
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
                    {activeLightbox.dayLabel} • {activeLightbox.category}
                  </span>
                  <button
                    onClick={() => setActiveLightbox(null)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-white">{activeLightbox.title}</h3>
                  <p className="text-xs text-indigo-400 mt-1">{activeLightbox.eventName} ({activeLightbox.year})</p>
                </div>

                <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
                  <div className="flex justify-between">
                    <span>Album:</span>
                    <span className="text-slate-200 font-medium">{activeLightbox.album}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded By:</span>
                    <span className="text-slate-200 font-medium">{activeLightbox.uploader}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="text-slate-200 font-medium">{activeLightbox.dateStr}</span>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload New Media Modal ── */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowUploadModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" /> Upload Event Media
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Media Title *</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g. Visarjan Procession Evening Dance"
                  value={uploadForm.title}
                  onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Event</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    value={uploadForm.eventName}
                    onChange={e => setUploadForm(f => ({ ...f, eventName: e.target.value }))}
                  >
                    {MOCK_EVENTS_LIST.map(ev => (
                      <option key={ev.id} value={ev.title}>{ev.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Year</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
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
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Day Tag</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    value={uploadForm.dayLabel}
                    onChange={e => setUploadForm(f => ({ ...f, dayLabel: e.target.value }))}
                  >
                    {["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Grand Finale"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    value={uploadForm.category}
                    onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORY_OPTIONS.filter(c => c !== "All Media").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Image / Video URL *</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-200"
                  placeholder="https://images.unsplash.com/..."
                  value={uploadForm.url}
                  onChange={e => setUploadForm(f => ({ ...f, url: e.target.value }))}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
