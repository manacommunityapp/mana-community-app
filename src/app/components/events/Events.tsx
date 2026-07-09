import {
  CalendarDays, MapPin, Users, Plus, X, Loader2, Clock, Search,
  Building2, BookOpen, Heart, GlassWater, Music, Trophy, MessageSquare,
  Video, ChevronDown, CheckCircle, Globe, DollarSign, Trash2
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { eventService, type EventResponse, type EventRequest } from "../../../services/eventService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const eventTypes = ["All", "GENERAL", "CONFERENCE", "WORKSHOP", "FUNDRAISER", "PARTY", "FESTIVAL", "SPORTS", "CULTURAL", "MEETING"];

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  GENERAL: { label: "General", icon: <CalendarDays className="w-3.5 h-3.5" />, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  CONFERENCE: { label: "Conference", icon: <Building2 className="w-3.5 h-3.5" />, color: "text-blue-600 bg-blue-50 border-blue-200" },
  WORKSHOP: { label: "Workshop", icon: <BookOpen className="w-3.5 h-3.5" />, color: "text-violet-600 bg-violet-50 border-violet-200" },
  FUNDRAISER: { label: "Fundraiser", icon: <Heart className="w-3.5 h-3.5" />, color: "text-pink-600 bg-pink-50 border-pink-200" },
  PARTY: { label: "Party", icon: <GlassWater className="w-3.5 h-3.5" />, color: "text-amber-600 bg-amber-50 border-amber-200" },
  FESTIVAL: { label: "Festival", icon: <Music className="w-3.5 h-3.5" />, color: "text-orange-600 bg-orange-50 border-orange-200" },
  SPORTS: { label: "Sports", icon: <Trophy className="w-3.5 h-3.5" />, color: "text-green-600 bg-green-50 border-green-200" },
  CULTURAL: { label: "Cultural", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-teal-600 bg-teal-50 border-teal-200" },
  MEETING: { label: "Meeting", icon: <Users className="w-3.5 h-3.5" />, color: "text-slate-600 bg-slate-50 border-slate-200" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
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

export function Events() {
  const [tab, setTab] = useState<"upcoming" | "all" | "mine">("upcoming");
  const [typeFilter, setTypeFilter] = useState("All");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let data: EventResponse[];
      if (tab === "mine") data = await eventService.getMyEvents();
      else if (tab === "all") data = await eventService.getAllEvents();
      else data = await eventService.getUpcomingEvents(typeFilter !== "All" ? typeFilter : undefined);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [tab, typeFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleCreate = async (data: EventRequest) => {
    try {
      await eventService.create(data);
      setShowCreate(false);
      fetchEvents();
    } catch { /* ignore */ }
  };

  const handleRegister = async (id: number) => {
    try {
      const updated = await eventService.register(id);
      if (selectedEvent?.id === id) setSelectedEvent(updated);
      fetchEvents();
    } catch { /* ignore */ }
  };

  const handleUnregister = async (id: number) => {
    try {
      const updated = await eventService.unregister(id);
      if (selectedEvent?.id === id) setSelectedEvent(updated);
      fetchEvents();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    try {
      await eventService.deleteEvent(id);
      setSelectedEvent(null);
      fetchEvents();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-indigo-600" />
            Community Events
          </h1>
          <p className="text-sm text-slate-500 mt-1">Discover and join events in your community</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm"
        >
          <Plus className="w-4 h-4" /> Create Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Events", value: events.length, color: "from-indigo-500 to-indigo-600" },
          { label: "Free Events", value: events.filter(e => e.priceType === "FREE").length, color: "from-green-500 to-green-600" },
          { label: "Registered", value: events.filter(e => e.isRegistered).length, color: "from-violet-500 to-violet-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={cn("text-2xl font-bold mt-1 bg-gradient-to-r bg-clip-text text-transparent", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Type Filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {([["upcoming", "Upcoming"], ["all", "All Events"], ["mine", "My Events"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setTypeFilter("All"); }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                tab === key ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "upcoming" && (
          <div className="relative">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {eventTypes.map(t => (
                <option key={t} value={t}>{t === "All" ? "All Types" : typeConfig[t]?.label || t}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Event Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No events found</p>
          <p className="text-slate-400 text-sm mt-1">Create an event to bring your community together</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => setSelectedEvent(event)}
              onRegister={handleRegister}
              onUnregister={handleUnregister}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRegister={handleRegister}
          onUnregister={handleUnregister}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function EventCard({ event, onClick, onRegister, onUnregister }: {
  event: EventResponse; onClick: () => void;
  onRegister: (id: number) => void; onUnregister: (id: number) => void;
}) {
  const tc = typeConfig[event.type] || typeConfig.GENERAL;

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {event.imageUrl && (
        <div className="h-40 bg-slate-100 overflow-hidden">
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", tc.color)}>
            {tc.icon} {tc.label}
          </span>
          {event.priceType === "FREE" ? (
            <span className="text-xs font-medium text-green-600">Free</span>
          ) : (
            <span className="text-xs font-medium text-amber-600">₹{event.price}</span>
          )}
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-1">{event.title}</h3>
        {event.description && <p className="text-sm text-slate-500 line-clamp-2 mb-3">{event.description}</p>}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-3">
          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {formatDate(event.startDate)}</span>
          {event.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(event.startTime)}</span>}
          {event.location && (
            <span className="flex items-center gap-1">
              {event.locationType === "ONLINE" ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              {event.location}
            </span>
          )}
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.attendees} attending</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">by {event.createdByName}</span>
          <button
            onClick={e => { e.stopPropagation(); event.isRegistered ? onUnregister(event.id) : onRegister(event.id); }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              event.isRegistered
                ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
            )}
          >
            {event.isRegistered ? "Registered ✓" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventDetailModal({ event, onClose, onRegister, onUnregister, onDelete }: {
  event: EventResponse; onClose: () => void;
  onRegister: (id: number) => void; onUnregister: (id: number) => void; onDelete: (id: number) => void;
}) {
  const tc = typeConfig[event.type] || typeConfig.GENERAL;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {event.imageUrl && (
          <div className="h-48 bg-slate-100 overflow-hidden rounded-t-2xl">
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mb-2", tc.color)}>
                {tc.icon} {tc.label}
              </span>
              <h2 className="text-xl font-bold text-slate-800">{event.title}</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
          </div>

          {event.description && (
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">{event.description}</div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 font-medium mb-1">Date</p>
              <p className="font-semibold text-slate-700">{formatDate(event.startDate)}{event.endDate ? ` – ${formatDate(event.endDate)}` : ""}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 font-medium mb-1">Time</p>
              <p className="font-semibold text-slate-700">
                {event.startTime ? formatTime(event.startTime) : "TBD"}
                {event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 font-medium mb-1">Location</p>
              <p className="font-semibold text-slate-700 flex items-center gap-1">
                {event.locationType === "ONLINE" ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {event.location || "TBD"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 font-medium mb-1">Price</p>
              <p className="font-semibold text-slate-700">
                {event.priceType === "FREE" ? "Free" : `₹${event.price}`}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 space-y-1">
            <p><Users className="w-3 h-3 inline mr-1" />{event.attendees} attending{event.capacity ? ` / ${event.capacity} capacity` : ""}</p>
            {event.organizerName && <p>Organized by {event.organizerName}</p>}
            {event.organizerContact && <p>Contact: {event.organizerContact}</p>}
            <p>Created by {event.createdByName} {timeAgo(event.createdAt)}</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => event.isRegistered ? onUnregister(event.id) : onRegister(event.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                event.isRegistered
                  ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl"
              )}
            >
              {event.isRegistered ? <><CheckCircle className="w-4 h-4" /> Registered</> : "Register Now"}
            </button>
            <button
              onClick={() => onDelete(event.id)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
              title="Delete event"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateEventModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: EventRequest) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("GENERAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationType, setLocationType] = useState("IN_PERSON");
  const [location, setLocation] = useState("");
  const [priceType, setPriceType] = useState("FREE");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerContact, setOrganizerContact] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      startDate,
      endDate: endDate || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      locationType,
      location: location.trim() || undefined,
      priceType,
      price: priceType === "PAID" && price ? parseFloat(price) : undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
      organizerName: organizerName.trim() || undefined,
      organizerContact: organizerContact.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Create Event</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Event Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What's the event?"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
            <div className="relative">
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                {eventTypes.filter(t => t !== "All").map(t => <option key={t} value={t}>{typeConfig[t]?.label || t}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Location Type</label>
            <div className="relative">
              <select value={locationType} onChange={e => setLocationType(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                <option value="IN_PERSON">In-Person</option>
                <option value="ONLINE">Online</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Location / Link</label>
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder={locationType === "ONLINE" ? "Meeting link" : "Venue name & address"}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date *</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">End Time</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell people what to expect..."
            rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Price</label>
            <div className="relative">
              <select value={priceType} onChange={e => setPriceType(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          {priceType === "PAID" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (₹)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Capacity</label>
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Unlimited"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Organizer Name</label>
            <input value={organizerName} onChange={e => setOrganizerName(e.target.value)} placeholder="Your name"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Contact</label>
            <input value={organizerContact} onChange={e => setOrganizerContact(e.target.value)} placeholder="Phone or email"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all">Create Event</button>
        </div>
      </form>
    </div>
  );
}
