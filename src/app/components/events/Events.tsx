import { useState, useEffect, useMemo } from "react";
import { safeStorage } from "../../../utils/storage";
import {
  CalendarDays,
  MapPin,
  Users,
  Bell,
  Search,
  Plus,
  BookOpen,
  Heart,
  GlassWater,
  Music,
  Building2,
  ExternalLink,
  ChevronRight,
  Info,
  DollarSign,
  Check,
  X,
  Sparkles,
  Video,
  Code,
  Network,
  Trophy,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "../ui/dialog";
import { toast, Toaster } from "sonner";
import { cn } from "../ui/utils";

// Interface for rich event representation
interface CustomEvent {
  id: number;
  title: string;
  type: string;
  description: string;
  date: string;
  time: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  locationType: "In-Person" | "Online";
  location: string;
  attendees: number;
  image: string;
  priceType: "Free" | "Paid";
  price?: number;
  capacity?: number;
  organizerName: string;
  organizerContact: string;
  isRegistered?: boolean;
}

// Categories definitions with Lucide Icons and Preset Unsplash Covers
const EVENT_CATEGORIES = [
  {
    id: "conferences",
    name: "Conferences",
    path: "/types/conferencewebsites",
    icon: Building2,
    description: "Professional conferences, panel discussions, and keynotes",
    presets: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800&h=450"
    ]
  },
  {
    id: "workshops",
    name: "Workshops & Classes",
    path: "/types/workshopwebsites",
    icon: BookOpen,
    description: "Interactive learning sessions, training, and educational bootcamps",
    presets: [
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800&h=450"
    ]
  },
  {
    id: "fundraisers",
    name: "Fundraisers",
    path: "/types/nonprofiteventwebsites",
    icon: Heart,
    description: "Charity fundraisers, benefit auctions, and community gala events",
    presets: [
      "https://images.unsplash.com/photo-1532629345422-7515f3d16bb8?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1469571486040-afbef0cd37bc?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=800&h=450"
    ]
  },
  {
    id: "parties",
    name: "Parties",
    path: "/types/partywebsites",
    icon: GlassWater,
    description: "Mixers, cocktail hours, socials, and celebrations",
    presets: [
      "https://images.unsplash.com/photo-1496337589254-7e19d01eae44?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800&h=450"
    ]
  },
  {
    id: "festivals",
    name: "Festivals",
    path: "/types/festivalwebsites",
    icon: Music,
    description: "Large cultural, music, arts, or community gatherings",
    presets: [
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800&h=450"
    ]
  },
  {
    id: "reunions",
    name: "Reunions",
    path: "/types/reunionwebsites",
    icon: Users,
    description: "Alumni reunions, department get-togethers, and family meetups",
    presets: [
      "https://images.unsplash.com/photo-1523580494112-071dcb85170d?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&q=80&w=800&h=450"
    ]
  },
  {
    id: "webinars",
    name: "Webinars & Seminars",
    path: "/types/webinars",
    icon: Video,
    description: "Online presentations, virtual talks, and online panel discussions",
    presets: [
      "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800&h=450"
    ]
  },
  {
    id: "hackathons",
    name: "Hackathons & Competitions",
    path: "/types/hackathons",
    icon: Code,
    description: "Collaborative coding challenges, hackathons, and gaming tournaments",
    presets: [
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800&h=450"
    ]
  },
  {
    id: "networking",
    name: "Networking Events",
    path: "/types/networking",
    icon: Network,
    description: "Professional speed-networking, mixers, and business gatherings",
    presets: [
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800&h=450"
    ]
  },
  {
    id: "sports",
    name: "Sports & Fitness",
    path: "/types/sports",
    icon: Trophy,
    description: "Tournaments, local matches, fitness camps, and hikes",
    presets: [
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1505250469613-2aabea9d491b?auto=format&fit=crop&q=80&w=800&h=450"
    ]
  },
  {
    id: "meetups",
    name: "Meetups & Discussions",
    path: "/types/meetups",
    icon: MessageSquare,
    description: "Small group discussions, book clubs, and tech chats",
    presets: [
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800&h=450",
      "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=800&h=450"
    ]
  }
];

const SEED_EVENTS: CustomEvent[] = [
  {
    id: 1,
    title: "Class of 2016 Reunion (CS Dept)",
    type: "Reunions",
    description: "Welcome back Class of 2016! Join us for a walk down memory lane, catch up with old classmates and faculty members, and discover what's new in the Computer Science department.",
    date: "May 15, 2026",
    time: "6:00 PM - 10:00 PM",
    startDate: "2026-05-15",
    endDate: "2026-05-15",
    startTime: "18:00",
    endTime: "22:00",
    locationType: "In-Person",
    location: "Main Auditorium, Campus",
    attendees: 145,
    image: "https://images.unsplash.com/photo-1523580494112-071dcb85170d?auto=format&fit=crop&q=80&w=800&h=450",
    priceType: "Free",
    capacity: 250,
    organizerName: "Alumni Association",
    organizerContact: "alumni@mana.edu",
    isRegistered: false
  },
  {
    id: 2,
    title: "Community Diwali Mela Planning Meeting",
    type: "Meetups & Discussions",
    description: "Let's gather to plan our biggest celebration of the year! We will discuss stalls, cultural programs, lighting, decorations, and residents responsibilities. All community residents are welcome to chip in.",
    date: "Oct 10, 2026",
    time: "10:00 AM - 12:00 PM",
    startDate: "2026-10-10",
    endDate: "2026-10-10",
    startTime: "10:00",
    endTime: "12:00",
    locationType: "In-Person",
    location: "Clubhouse Conference Room",
    attendees: 32,
    image: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=800&h=450",
    priceType: "Free",
    capacity: 50,
    organizerName: "Resident Committee",
    organizerContact: "committee@mana.community",
    isRegistered: false
  }
];

export function Events() {
  // --- States ---
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [reminders, setReminders] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Advanced filters
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [rsvpFilter, setRsvpFilter] = useState<string>("all");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<CustomEvent | null>(null);

  // Form state
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: EVENT_CATEGORIES[0].name,
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    locationType: "In-Person" as "In-Person" | "Online",
    location: "",
    priceType: "Free" as "Free" | "Paid",
    price: 0,
    capacity: 0,
    organizerName: "",
    organizerContact: "",
    image: EVENT_CATEGORIES[0].presets[0],
    customImageUrl: ""
  });

  // --- Effects ---
  useEffect(() => {
    // Hydrate events from local storage or populate seeds
    const saved = safeStorage.getItem("mana_community_events");
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) {
        setEvents(SEED_EVENTS);
      }
    } else {
      setEvents(SEED_EVENTS);
      safeStorage.setItem("mana_community_events", JSON.stringify(SEED_EVENTS));
    }

    // Hydrate reminders
    const savedReminders = safeStorage.getItem("mana_event_reminders");
    if (savedReminders) {
      try {
        setReminders(JSON.parse(savedReminders));
      } catch (e) {
        setReminders([]);
      }
    }
  }, []);

  // Sync events & reminders to local storage on changes
  const saveEvents = (updated: CustomEvent[]) => {
    setEvents(updated);
    safeStorage.setItem("mana_community_events", JSON.stringify(updated));
  };

  const saveReminders = (updated: number[]) => {
    setReminders(updated);
    safeStorage.setItem("mana_event_reminders", JSON.stringify(updated));
  };

  // --- Date/Time Formatting Utilities ---
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (isNaN(Date.parse(dateStr))) return dateStr;
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatTime = (startTime: string, endTime: string) => {
    if (!startTime) return "";
    
    const formatSingleTime = (t: string) => {
      const [hours, minutes] = t.split(":");
      const h = parseInt(hours);
      const ampm = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 || 12;
      return `${displayH}:${minutes} ${ampm}`;
    };

    if (endTime) {
      return `${formatSingleTime(startTime)} - ${formatSingleTime(endTime)}`;
    }
    return formatSingleTime(startTime);
  };

  // --- Change Handler for Type Select ---
  const handleTypeChange = (typeName: string) => {
    const category = EVENT_CATEGORIES.find(c => c.name === typeName);
    const defaultPreset = category ? category.presets[0] : "";
    setNewEvent(prev => ({
      ...prev,
      type: typeName,
      image: defaultPreset
    }));
  };

  // --- Search & Filtering Logic ---
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // 1. Search Query Match
      const matchesSearch = 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizerName.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Category Match
      const matchesCategory = 
        selectedCategory === "all" || 
        event.type.toLowerCase() === selectedCategory.toLowerCase();

      // 3. Location Type Match
      const matchesLocation =
        locationFilter === "all" ||
        event.locationType.toLowerCase() === locationFilter.toLowerCase();

      // 4. Price Match
      const matchesPrice =
        priceFilter === "all" ||
        event.priceType.toLowerCase() === priceFilter.toLowerCase();

      // 5. RSVP Match
      const matchesRsvp =
        rsvpFilter === "all" ||
        (rsvpFilter === "registered" && event.isRegistered);

      return matchesSearch && matchesCategory && matchesLocation && matchesPrice && matchesRsvp;
    });
  }, [events, searchQuery, selectedCategory, locationFilter, priceFilter, rsvpFilter]);

  // Compute counts for category badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length };
    EVENT_CATEGORIES.forEach(cat => {
      counts[cat.id] = events.filter(e => e.type.toLowerCase() === cat.name.toLowerCase()).length;
    });
    return counts;
  }, [events]);

  // --- Create Event Action ---
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEvent.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }
    if (!newEvent.startDate) {
      toast.error("Please select a start date");
      return;
    }
    if (!newEvent.startTime) {
      toast.error("Please select a start time");
      return;
    }
    if (!newEvent.location.trim()) {
      toast.error(newEvent.locationType === "Online" ? "Please enter a virtual meeting URL" : "Please specify the venue location");
      return;
    }

    const selectedImage = newEvent.customImageUrl.trim() || newEvent.image;
    const dateText = formatDate(newEvent.startDate);
    const timeText = formatTime(newEvent.startTime, newEvent.endTime);

    const eventToAdd: CustomEvent = {
      id: Date.now(),
      title: newEvent.title,
      type: newEvent.type,
      description: newEvent.description || "Join us for this exciting event!",
      date: dateText,
      time: timeText,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate || newEvent.startDate,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      locationType: newEvent.locationType,
      location: newEvent.location,
      attendees: 0,
      image: selectedImage,
      priceType: newEvent.priceType,
      price: newEvent.priceType === "Paid" ? Number(newEvent.price) : undefined,
      capacity: newEvent.capacity ? Number(newEvent.capacity) : undefined,
      organizerName: newEvent.organizerName || "Community Member",
      organizerContact: newEvent.organizerContact || "",
      isRegistered: false
    };

    const updated = [eventToAdd, ...events];
    saveEvents(updated);
    toast.success("Event created successfully!");
    setIsCreateOpen(false);

    // Reset Form State
    setNewEvent({
      title: "",
      type: EVENT_CATEGORIES[0].name,
      description: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      locationType: "In-Person",
      location: "",
      priceType: "Free",
      price: 0,
      capacity: 0,
      organizerName: "",
      organizerContact: "",
      image: EVENT_CATEGORIES[0].presets[0],
      customImageUrl: ""
    });
  };

  // --- RSVP/Registration Trigger ---
  const handleRegisterToggle = (eventId: number) => {
    const updated = events.map(e => {
      if (e.id === eventId) {
        const currentlyRegistered = !!e.isRegistered;
        const newRegStatus = !currentlyRegistered;

        if (newRegStatus) {
          // Check capacity
          if (e.capacity && e.attendees >= e.capacity) {
            toast.error("Sorry, this event has reached its registration capacity.");
            return e;
          }
          toast.success(`Registered successfully for "${e.title}"!`);
        } else {
          toast.info(`Cancelled registration for "${e.title}".`);
        }

        return {
          ...e,
          isRegistered: newRegStatus,
          attendees: currentlyRegistered ? Math.max(0, e.attendees - 1) : e.attendees + 1
        };
      }
      return e;
    });

    saveEvents(updated);
    
    // Update active details overlay if open
    const refreshedActive = updated.find(e => e.id === eventId);
    if (refreshedActive) {
      setActiveEvent(refreshedActive);
    }
  };

  // --- Reminder Toggle Action ---
  const handleReminderToggle = (eventId: number) => {
    const isSet = reminders.includes(eventId);
    let updatedReminders: number[];

    if (isSet) {
      updatedReminders = reminders.filter(id => id !== eventId);
      toast.info("Reminder removed.");
    } else {
      updatedReminders = [...reminders, eventId];
      toast.success("Reminder set! We will notify you before the event starts.");
    }

    saveReminders(updatedReminders);
  };

  // --- Reset All Filters ---
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setLocationFilter("all");
    setPriceFilter("all");
    setRsvpFilter("all");
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Events & Reunions
            <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full">
              {events.length} Total
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Discover, participate in, or host meetups, reunions, and learning workshops inside your community.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Event
        </button>
      </div>

      {/* Category Pills (Horizontal Scroll) */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer border",
              selectedCategory === "all"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-900"
            )}
          >
            <Sparkles className="w-4 h-4" />
            All Events
            <span className={cn("text-xs px-1.5 py-0.25 rounded-full font-bold", selectedCategory === "all" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
              {categoryCounts.all}
            </span>
          </button>

          {EVENT_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer border",
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-900"
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
                {count > 0 && (
                  <span className={cn("text-xs px-1.5 py-0.25 rounded-full font-bold", selectedCategory === cat.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Filters & Search */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search events, host, venue..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-slate-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Location */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Format:</span>
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Formats</option>
              <option value="in-person">In-Person</option>
              <option value="online">Online</option>
            </select>
          </div>

          {/* Pricing */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Entry:</span>
            <select
              value={priceFilter}
              onChange={e => setPriceFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Admission</option>
              <option value="free">Free Only</option>
              <option value="paid">Paid Only</option>
            </select>
          </div>

          {/* RSVP Status */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">RSVP:</span>
            <select
              value={rsvpFilter}
              onChange={e => setRsvpFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Events</option>
              <option value="registered">Registered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Featured Banner (Shown when no active filters are set & seed events exist) */}
      {!searchQuery && selectedCategory === "all" && locationFilter === "all" && priceFilter === "all" && rsvpFilter === "all" && events.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl overflow-hidden shadow-lg relative border border-indigo-500/10">
          <div className="absolute inset-0 bg-indigo-500/5 mix-blend-color-dodge"></div>
          <div className="relative p-6 sm:p-10 flex flex-col lg:flex-row gap-6 items-center">
            <div className="flex-1 text-left">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-4 inline-block">
                ★ Highlighted Community Event
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">Annual Tech Alumni Meetup</h2>
              <p className="text-indigo-200/80 max-w-xl mb-6 leading-relaxed text-sm sm:text-base">
                Join us for the premier networking event of the season. Expand your community circle, exchange referral cards, attend developer workshops, and enjoy a catered buffet dinner.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-medium text-white/90 mb-8">
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                  <CalendarDays className="w-4 h-4 text-indigo-400" /> Aug 20, 2026 • 5:00 PM
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                  <MapPin className="w-4 h-4 text-indigo-400" /> Grand Hotel Convention Hall
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                  <DollarSign className="w-4 h-4 text-indigo-400" /> Entry: Free RSVP
                </div>
              </div>
              <button
                onClick={() => {
                  const match = events.find(e => e.title.includes("Alumni Meetup"));
                  if (match) {
                    setActiveEvent(match);
                    setIsDetailsOpen(true);
                  } else {
                    const featured: CustomEvent = {
                      id: 999,
                      title: "Annual Tech Alumni Meetup",
                      type: "Conferences",
                      description: "Join us for the premier networking event of the season. Expand your community circle, exchange referral cards, attend developer workshops, and enjoy a catered buffet dinner.",
                      date: "Aug 20, 2026",
                      time: "5:00 PM - 9:00 PM",
                      startDate: "2026-08-20",
                      endDate: "2026-08-20",
                      startTime: "17:00",
                      endTime: "21:00",
                      locationType: "In-Person",
                      location: "Grand Hotel Convention Hall",
                      attendees: 350,
                      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800&h=450",
                      priceType: "Free",
                      capacity: 500,
                      organizerName: "Developer Network Committee",
                      organizerContact: "dev-committee@mana.community"
                    };
                    const updated = [featured, ...events];
                    saveEvents(updated);
                    setActiveEvent(featured);
                    setIsDetailsOpen(true);
                  }
                }}
                className="px-6 py-3 bg-white hover:bg-slate-100 text-indigo-900 font-bold rounded-xl transition-all shadow-md cursor-pointer text-sm"
              >
                View Event Info
              </button>
            </div>
            <div className="hidden lg:block w-72">
              <div className="aspect-square bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col justify-center items-center text-center backdrop-blur shadow-2xl">
                <div className="text-4xl font-black text-white mb-1">350+</div>
                <div className="text-indigo-200/80 font-bold uppercase tracking-widest text-[10px]">Attending</div>
                <div className="mt-6 flex -space-x-3 justify-center">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-indigo-900 bg-cover bg-center"
                      style={{ backgroundImage: `url(https://images.unsplash.com/photo-${1500000000000 + i * 100000}?auto=format&fit=crop&w=60&h=60)` }}
                    ></div>
                  ))}
                </div>
                <div className="mt-4 text-[10px] text-indigo-300 font-medium">Click to claim your spot</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Grid Section */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
          Upcoming Schedule
          {filteredEvents.length !== events.length && (
            <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-0.5 rounded-full">
              Filtered: {filteredEvents.length}
            </span>
          )}
        </h3>

        {filteredEvents.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 px-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm max-w-lg mx-auto">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-1">No Events Found</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              There are no events matching your query or filter parameters. Try clearing your filters or create a new event.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset All Filters
              </Button>
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                + Create Event
              </Button>
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.map(event => {
              const categoryMeta = EVENT_CATEGORIES.find(c => c.name.toLowerCase() === event.type.toLowerCase());
              const IconComponent = categoryMeta?.icon || CalendarDays;
              const isReminded = reminders.includes(event.id);

              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col group hover:shadow-md transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {/* Event Thumbnail */}
                  <div className="h-44 relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                    {/* Category Overlay Tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                      <IconComponent className="w-3.5 h-3.5" />
                      {event.type}
                    </div>

                    {/* Price/Free Tag Overlay */}
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-xs font-bold bg-white text-indigo-900 shadow-sm dark:bg-slate-900 dark:text-indigo-400">
                      {event.priceType === "Free" ? "Free" : `₹${event.price}`}
                    </div>

                    {/* RSVP Badge */}
                    {event.isRegistered && (
                      <div className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm animate-fade-in">
                        <Check className="w-3 h-3" /> Registered
                      </div>
                    )}
                  </div>

                  {/* Body details */}
                  <div className="p-5 flex-1 flex flex-col text-left">
                    <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {event.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed flex-1">
                      {event.description}
                    </p>

                    {/* Meta Fields */}
                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span className="truncate">{event.date} • {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span className="truncate" title={event.location}>
                          {event.locationType === "Online" ? "Online Meeting Link" : event.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span>
                          {event.attendees} Registered
                          {event.capacity ? ` / ${event.capacity} Max` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        onClick={() => {
                          setActiveEvent(event);
                          setIsDetailsOpen(true);
                        }}
                        className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 border border-indigo-100/30 cursor-pointer"
                      >
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReminderToggle(event.id)}
                        className={cn(
                          "p-2 rounded-xl border transition-all cursor-pointer",
                          isReminded
                            ? "bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-950/30 dark:border-amber-700/50"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900"
                        )}
                        title={isReminded ? "Remove Reminder" : "Set Reminder Alert"}
                      >
                        <Bell className={cn("w-4 h-4", isReminded && "fill-amber-500")} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================= */}
      {/* DIALOG 1: "CREATE EVENT" FORM           */}
      {/* ======================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-indigo-600" /> Host an Event
            </DialogTitle>
            <DialogDescription>
              Create a custom community event. Fill out the details below to publish your event.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvent} className="space-y-6 text-left">
            {/* Event Name */}
            <div className="space-y-1.5">
              <Label htmlFor="event-title">Event Title <span className="text-red-500">*</span></Label>
              <Input
                id="event-title"
                required
                placeholder="e.g. Creative Coding Mixer, Chess Championship"
                value={newEvent.title}
                onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
              />
            </div>

            {/* Visual Event Category Picker */}
            <div className="space-y-2">
              <Label>Select Event Type <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                {EVENT_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = newEvent.type === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleTypeChange(cat.name)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all cursor-pointer",
                        isSelected
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <Icon className="w-5 h-5 mb-1.5" />
                      <span className="text-xs font-semibold">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="event-description">About the Event</Label>
              <Textarea
                id="event-description"
                placeholder="Describe what guests can expect, schedule, requirements..."
                value={newEvent.description}
                onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                className="min-h-20"
              />
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="event-start-date">Date <span className="text-red-500">*</span></Label>
                <Input
                  id="event-start-date"
                  type="date"
                  required
                  value={newEvent.startDate}
                  onChange={e => setNewEvent(p => ({ ...p, startDate: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="event-start-time">Start Time <span className="text-red-500">*</span></Label>
                  <Input
                    id="event-start-time"
                    type="time"
                    required
                    value={newEvent.startTime}
                    onChange={e => setNewEvent(p => ({ ...p, startTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="event-end-time">End Time</Label>
                  <Input
                    id="event-end-time"
                    type="time"
                    value={newEvent.endTime}
                    onChange={e => setNewEvent(p => ({ ...p, endTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Format & Location */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="font-bold">Event Format:</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-sm font-medium cursor-pointer text-slate-800 dark:text-slate-200">
                    <input
                      type="radio"
                      name="locationType"
                      checked={newEvent.locationType === "In-Person"}
                      onChange={() => setNewEvent(p => ({ ...p, locationType: "In-Person", location: "" }))}
                      className="accent-indigo-600"
                    />
                    In-Person Venue
                  </label>
                  <label className="flex items-center gap-1.5 text-sm font-medium cursor-pointer text-slate-800 dark:text-slate-200">
                    <input
                      type="radio"
                      name="locationType"
                      checked={newEvent.locationType === "Online"}
                      onChange={() => setNewEvent(p => ({ ...p, locationType: "Online", location: "" }))}
                      className="accent-indigo-600"
                    />
                    Online Webinar / Meeting
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-location">
                  {newEvent.locationType === "Online" ? "Meeting URL / Access Link" : "Venue Location & Address"} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="event-location"
                  required
                  placeholder={newEvent.locationType === "Online" ? "e.g. Zoom link, Google Meet URL" : "e.g. Clubhouse Conference Room, Tower B Ground Floor"}
                  value={newEvent.location}
                  onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))}
                />
              </div>
            </div>

            {/* RSVP & Capacity Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/10">
              {/* Pricing */}
              <div className="space-y-3 text-left">
                <Label className="font-bold">Admission Type</Label>
                <div className="flex items-center gap-4 mt-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="priceType"
                      checked={newEvent.priceType === "Free"}
                      onChange={() => setNewEvent(p => ({ ...p, priceType: "Free", price: 0 }))}
                      className="accent-indigo-600"
                    />
                    Free Entry
                  </label>
                  <label className="flex items-center gap-1.5 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="priceType"
                      checked={newEvent.priceType === "Paid"}
                      onChange={() => setNewEvent(p => ({ ...p, priceType: "Paid" }))}
                      className="accent-indigo-600"
                    />
                    Paid Ticket
                  </label>
                </div>
                {newEvent.priceType === "Paid" && (
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className="text-xs font-bold text-slate-500">Price (₹):</span>
                    <Input
                      type="number"
                      required
                      min={1}
                      placeholder="Admission fee"
                      value={newEvent.price || ""}
                      onChange={e => setNewEvent(p => ({ ...p, price: Number(e.target.value) }))}
                      className="w-32 h-8 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Capacity Limit */}
              <div className="space-y-2">
                <Label htmlFor="event-capacity">Attendance Limit</Label>
                <Input
                  id="event-capacity"
                  type="number"
                  min={0}
                  placeholder="Unlimited seats if 0 or blank"
                  value={newEvent.capacity || ""}
                  onChange={e => setNewEvent(p => ({ ...p, capacity: Number(e.target.value) }))}
                />
                <span className="text-[10px] text-slate-400 font-medium leading-none block">Leave empty if anyone can attend.</span>
              </div>
            </div>

            {/* Host Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="organizer-name">Host / Organizer Name</Label>
                <Input
                  id="organizer-name"
                  placeholder="Name or committee"
                  value={newEvent.organizerName}
                  onChange={e => setNewEvent(p => ({ ...p, organizerName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="organizer-contact">Organizer Contact</Label>
                <Input
                  id="organizer-contact"
                  placeholder="Email or phone number"
                  value={newEvent.organizerContact}
                  onChange={e => setNewEvent(p => ({ ...p, organizerContact: e.target.value }))}
                />
              </div>
            </div>

            {/* Cover Image Selector */}
            <div className="space-y-3 pt-2">
              <Label>Cover Theme / Image Presets</Label>
              <div className="grid grid-cols-3 gap-2">
                {(EVENT_CATEGORIES.find(c => c.name === newEvent.type)?.presets || EVENT_CATEGORIES[0].presets).map((presetImg, idx) => {
                  const isSelected = newEvent.image === presetImg && !newEvent.customImageUrl;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewEvent(p => ({ ...p, image: presetImg, customImageUrl: "" }))}
                      className={cn(
                        "relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer",
                        isSelected ? "border-indigo-600 scale-[0.97]" : "border-slate-100 hover:border-slate-200 dark:border-slate-900"
                      )}
                    >
                      <img src={presetImg} className="w-full h-full object-cover" alt="Cover Option" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                          <span className="bg-indigo-600 text-white rounded-full p-0.5">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1">
                <Label htmlFor="custom-cover-url" className="text-xs font-normal text-slate-500">Or use a custom URL</Label>
                <Input
                  id="custom-cover-url"
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newEvent.customImageUrl}
                  onChange={e => setNewEvent(p => ({ ...p, customImageUrl: e.target.value }))}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                Publish Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================= */}
      {/* DIALOG 2: "EVENT DETAILS" OVERLAY VIEW   */}
      {/* ======================================= */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        {activeEvent && (
          <DialogContent className="max-w-2xl p-0 overflow-hidden text-left bg-white dark:bg-slate-950">
            {/* Image Header */}
            <div className="h-64 sm:h-72 w-full relative">
              <img
                src={activeEvent.image}
                className="w-full h-full object-cover"
                alt={activeEvent.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 flex flex-col justify-end p-6">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md">
                    {activeEvent.type}
                  </span>
                  <span className="bg-white text-slate-900 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                    {activeEvent.priceType === "Free" ? "Free" : `₹${activeEvent.price}`}
                  </span>
                  {activeEvent.isRegistered && (
                    <span className="bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                      <Check className="w-3 h-3" /> Registered
                    </span>
                  )}
                </div>
                {/* Title */}
                <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {activeEvent.title}
                </DialogTitle>
              </div>
              <DialogClose className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white hover:text-white rounded-full p-2 border border-white/20 backdrop-blur-sm cursor-pointer outline-none">
                <X className="w-4 h-4" />
              </DialogClose>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-6">
              {/* Event Metadata Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <div className="space-y-3 text-sm">
                  {/* Date & Time */}
                  <div className="flex gap-2.5">
                    <CalendarDays className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Date & Time</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 text-left">
                        {activeEvent.date}
                        <br />
                        {activeEvent.time}
                      </p>
                    </div>
                  </div>

                  {/* Location Venue */}
                  <div className="flex gap-2.5">
                    <MapPin className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {activeEvent.locationType === "Online" ? "Online Meeting" : "Venue Address"}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate text-left" title={activeEvent.location}>
                        {activeEvent.location}
                      </p>
                      {activeEvent.locationType === "Online" && activeEvent.isRegistered && (
                        <a
                          href={activeEvent.location.startsWith("http") ? activeEvent.location : `https://${activeEvent.location}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-500 text-xs font-semibold inline-flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          Join Broadcast <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  {/* Host */}
                  <div className="flex gap-2.5">
                    <Users className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Organizer</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 text-left">
                        {activeEvent.organizerName}
                        {activeEvent.organizerContact && (
                          <span className="block text-[10px] text-slate-400 mt-0.5 italic">
                            ({activeEvent.organizerContact})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Pricing / Limits */}
                  <div className="flex gap-2.5">
                    <DollarSign className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Registration Details</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 text-left">
                        {activeEvent.priceType === "Free" ? "Free Admission" : `Admission Fee: ₹${activeEvent.price}`}
                        <br />
                        {activeEvent.attendees} Attending
                        {activeEvent.capacity ? ` / Limit ${activeEvent.capacity} guests` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-500" /> About the Event
                </h5>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line text-left">
                  {activeEvent.description}
                </p>
              </div>

              {/* Action Buttons footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Remind alert toggle */}
                <button
                  onClick={() => handleReminderToggle(activeEvent.id)}
                  className={cn(
                    "w-full sm:w-auto px-4 py-2 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    reminders.includes(activeEvent.id)
                      ? "bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-950/20 dark:border-amber-700/50 dark:text-amber-400"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-400"
                  )}
                >
                  <Bell className={cn("w-4 h-4", reminders.includes(activeEvent.id) && "fill-amber-500 text-amber-500")} />
                  {reminders.includes(activeEvent.id) ? "Reminder Set" : "Notify Me"}
                </button>

                {/* RSVP Register Action */}
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <DialogClose asChild>
                    <Button variant="outline" size="sm">Close Details</Button>
                  </DialogClose>

                  <button
                    onClick={() => handleRegisterToggle(activeEvent.id)}
                    className={cn(
                      "px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 justify-center",
                      activeEvent.isRegistered
                        ? "bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-600 hover:border-red-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        : activeEvent.capacity && activeEvent.attendees >= activeEvent.capacity
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/20"
                    )}
                  >
                    {activeEvent.isRegistered ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Registered
                      </>
                    ) : activeEvent.capacity && activeEvent.attendees >= activeEvent.capacity ? (
                      "Sold Out"
                    ) : (
                      "Register for Event"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
