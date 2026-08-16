import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useEventMock } from "./EventMockToggle";
import { eventService, type DashboardStatsResponse } from "../../../services/events/eventService";
import {
  Flame,
  Music,
  Trophy,
  Ticket,
  ShieldCheck,
  Heart,
  Utensils,
  Gavel,
  Search,
  MapPin,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  QrCode,
  Sparkles,
  User,
  Users,
  CheckCircle2,
  Plus,
  ArrowRight,
  Download,
  Calendar,
  Smartphone,
  X,
  AlertCircle,
  UserPlus,
  Loader2,
  Filter,
} from "lucide-react";

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  avatar: string;
}

interface Activity {
  id: string;
  title: string;
  category: "Pooja" | "Cultural" | "Competitions" | "Food" | "Volunteer" | "Donation" | "Auction" | "Other";
  date: string;
  time: string;
  venue: string;
  fee: number;
  availableSeats: number;
  image: string;
  description: string;
}

interface UserPass {
  id: string;
  passType: string;
  title: string;
  participantName: string;
  regId: string;
  date: string;
  time: string;
  venue: string;
  status: "CONFIRMED" | "PENDING APPROVAL";
  qrCodeUrl: string;
}

const INITIAL_FAMILY: FamilyMember[] = [
  { id: "1", name: "Sandeep Verma", relation: "Myself (Head)", age: 38, avatar: "👤" },
  { id: "2", name: "Ananya Verma", relation: "Spouse", age: 35, avatar: "👩" },
  { id: "3", name: "Rahul Verma", relation: "Son", age: 10, avatar: "👦" },
  { id: "4", name: "Priya Verma", relation: "Daughter", age: 7, avatar: "👧" },
];

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: "act-1",
    title: "Maha Ganapathi Archana & Silver Shield Pooja",
    category: "Pooja",
    date: "22 Aug 2026",
    time: "08:00 AM - 09:30 AM",
    venue: "Main Temple Mandap, Gate 1",
    fee: 501,
    availableSeats: 14,
    image: "🪔",
    description: "Special morning Sankalpa and Archana with personalized names announced by Priests.",
  },
  {
    id: "act-4",
    title: "Community Satvik Mahaprasadam (Lunch & Dinner)",
    category: "Food",
    date: "22 Aug 2026",
    time: "12:30 PM - 03:00 PM & 07:30 PM - 10:00 PM",
    venue: "Annadanam Dining Hall, Gate 2",
    fee: 0,
    availableSeats: 450,
    image: "🍲",
    description: "Traditional Satvik Bhojanam (Lunch and Dinner Mahaprasadam) served freely to all community devotees.",
  },
  {
    id: "act-2",
    title: "Kids Classical Fusion Dance Performance",
    category: "Cultural",
    date: "23 Aug 2026",
    time: "05:30 PM - 07:00 PM",
    venue: "Auditorium Stage A",
    fee: 0,
    availableSeats: 6,
    image: "🎭",
    description: "Group performance event. Costumes & track upload required before Aug 18.",
  },
  {
    id: "act-3",
    title: "Community Eco-Ganesha Making Competition",
    category: "Competitions",
    date: "21 Aug 2026",
    time: "10:00 AM - 12:00 PM",
    venue: "Clubhouse Activity Hall",
    fee: 150,
    availableSeats: 8,
    image: "🎨",
    description: "Clay provided on spot. Bring your own decorations. Top 3 winner trophies.",
  },
];

const INITIAL_PASSES: UserPass[] = [
  {
    id: "pass-1",
    passType: "Pooja Seva Token",
    title: "Maha Ganapathi Archana & Silver Shield",
    participantName: "Sandeep Verma & Family",
    regId: "MNA-2026-POOJA-0822",
    date: "22 Aug 2026",
    time: "08:00 AM - 09:30 AM",
    venue: "Main Temple Mandap",
    status: "CONFIRMED",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MNA-2026-POOJA-0822",
  },
  {
    id: "pass-2",
    passType: "Cultural Pass",
    title: "Kids Classical Fusion Dance",
    participantName: "Rahul Verma (Son)",
    regId: "MNA-2026-CULT-1102",
    date: "23 Aug 2026",
    time: "05:30 PM",
    venue: "Auditorium Stage A",
    status: "PENDING APPROVAL",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MNA-2026-CULT-1102",
  },
];

export function EventMemberView() {
  const { user } = useAuth();
  const { useMock } = useEventMock();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(["1"]);
  const [activeTab, setActiveTab] = useState<"home" | "passes" | "auction">("home");
  const [showQRPass, setShowQRPass] = useState<UserPass | null>(null);
  const [showFamily, setShowFamily] = useState(false);
  const [passesList, setPassesList] = useState<UserPass[]>(() => (useMock ? INITIAL_PASSES : []));
  const [activitiesList, setActivitiesList] = useState<Activity[]>(() => (useMock ? INITIAL_ACTIVITIES : []));
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(INITIAL_FAMILY);
  const [liveStats, setLiveStats] = useState<DashboardStatsResponse | null>(null);
  const [loadingApiData, setLoadingApiData] = useState(false);

  // Modal State for Adding Dynamic Family Member
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    relation: "Son",
    age: "",
    avatar: "👦",
  });

  // Fetch activities & main events & dashboard metrics from live REST API
  const fetchLiveDataFromBackend = async () => {
    if (useMock) {
      try {
        const customActivities: Activity[] = JSON.parse(localStorage.getItem("mana_custom_activities") || "[]");
        const storedEvents: any[] = JSON.parse(localStorage.getItem("mana_events") || "[]");

        const mappedMainEvents: Activity[] = storedEvents.map((ev: any) => ({
          id: `event-${ev.id || Date.now()}`,
          title: ev.title || ev.name || "Community Parent Event",
          category: ev.category || ev.type || "Pooja",
          date: ev.startDate ? String(ev.startDate) : "Upcoming",
          time: ev.startTime || "Morning",
          venue: ev.venue || ev.location || "Main Temple Mandap, Gate 1",
          fee: ev.price ? Number(ev.price) : 0,
          availableSeats: ev.capacity || 50,
          image: "📅",
          description: ev.description || "Community Parent Event created by Admin",
        }));

        const combinedMock = [...mappedMainEvents, ...customActivities, ...INITIAL_ACTIVITIES];
        setActivitiesList(combinedMock);
      } catch (e) {
        setActivitiesList(INITIAL_ACTIVITIES);
      }
      return;
    }

    try {
      setLoadingApiData(true);
      const [mainEvents, poojas, culturals, comps, meals, stats] = await Promise.all([
        eventService.getUpcomingEvents().catch(() => []),
        eventService.getPoojaSevas().catch(() => []),
        eventService.getCulturalEvents().catch(() => []),
        eventService.getCompetitions().catch(() => []),
        eventService.getLunchDinners().catch(() => []),
        eventService.getDashboardStats().catch(() => null),
      ]);

      setLiveStats(stats);

      const fetchedActivities: Activity[] = [];

      if (mainEvents && Array.isArray(mainEvents)) {
        mainEvents.forEach((ev: any) => {
          fetchedActivities.push({
            id: `event-${ev.id}`,
            title: ev.title,
            category: ev.category || ev.type || "Pooja",
            date: ev.startDate ? String(ev.startDate) : "Upcoming",
            time: ev.startTime || "Morning",
            venue: ev.venue || ev.location || "Main Temple Mandap, Gate 1",
            fee: ev.price ? Number(ev.price) : 0,
            availableSeats: ev.capacity || 50,
            image: "📅",
            description: ev.description || "Community Parent Event",
          });
        });
      }

      if (poojas && Array.isArray(poojas)) {
        poojas.forEach((p: any) => {
          fetchedActivities.push({
            id: `pooja-${p.id || Date.now()}`,
            title: p.name || "Pooja Seva",
            category: "Pooja",
            date: p.date ? String(p.date) : "Upcoming",
            time: p.startTime ? `${p.startTime}` : "Morning",
            venue: p.mandap || "Main Temple Mandap, Gate 1",
            fee: p.isFree ? 0 : Number(p.fee || 501),
            availableSeats: p.slots || 20,
            image: "🪔",
            description: `Pandit: ${p.pandit || "Temple Priest"}. ${p.notes || ""}`,
          });
        });
      }

      if (meals && Array.isArray(meals)) {
        meals.forEach((m: any) => {
          fetchedActivities.push({
            id: `food-${m.id || Date.now()}`,
            title: m.name || "Community Mahaprasadam",
            category: "Food",
            date: m.date ? String(m.date) : "Upcoming",
            time: m.startTime && m.endTime ? `${m.startTime} - ${m.endTime}` : (m.startTime || "Afternoon / Evening"),
            venue: m.venue || "Annadanam Dining Hall, Gate 2",
            fee: m.isFree ? 0 : Number(m.fee || 50),
            availableSeats: m.targetPlates || 500,
            image: "🍲",
            description: `Meal: ${m.mealType || "Bhojanam"}. Caterer: ${m.caterer || "Food Committee"}. Menu: ${Array.isArray(m.menuItems) ? m.menuItems.join(", ") : ""}. ${m.notes || ""}`,
          });
        });
      }

      if (culturals && Array.isArray(culturals)) {
        culturals.forEach((c: any) => {
          fetchedActivities.push({
            id: `cult-${c.id || Date.now()}`,
            title: c.name || "Cultural Performance",
            category: "Cultural",
            date: c.date ? String(c.date) : "Upcoming",
            time: c.startTime || "Evening",
            venue: c.stage || "Auditorium Stage A",
            fee: 0,
            availableSeats: 30,
            image: "🎭",
            description: `Category: ${c.category}. Type: ${c.perfType || "Group"}. Age: ${c.ageGroup || "All"}.`,
          });
        });
      }

      if (comps && Array.isArray(comps)) {
        comps.forEach((cm: any) => {
          fetchedActivities.push({
            id: `comp-${cm.id || Date.now()}`,
            title: cm.name || "Community Competition",
            category: "Competitions",
            date: cm.date ? String(cm.date) : "Upcoming",
            time: cm.startTime || "Morning",
            venue: cm.venue || "Clubhouse Activity Hall",
            fee: cm.isFree ? 0 : Number(cm.fee || 100),
            availableSeats: cm.maxParticipants || 50,
            image: "🏆",
            description: `Category: ${cm.category}. Age Group: ${cm.ageGroup || "Open"}. Rules: ${cm.rules || ""}`,
          });
        });
      }

      const custom: Activity[] = JSON.parse(localStorage.getItem("mana_custom_activities") || "[]");
      const combined = [...fetchedActivities, ...custom];

      setActivitiesList(combined);
    } catch (err) {
      console.warn("Failed to fetch live API events:", err);
      try {
        const custom: Activity[] = JSON.parse(localStorage.getItem("mana_custom_activities") || "[]");
        setActivitiesList(custom);
      } catch {
        setActivitiesList([]);
      }
    } finally {
      setLoadingApiData(false);
    }
  };

  // Load family members dynamically
  const loadFamilyMembers = () => {
    try {
      const stored: FamilyMember[] = JSON.parse(localStorage.getItem("mana_family_members") || "[]");
      if (stored.length > 0) {
        const existingIds = new Set(INITIAL_FAMILY.map((f) => f.id));
        const customOnly = stored.filter((s) => !existingIds.has(s.id));
        setFamilyMembers([...INITIAL_FAMILY, ...customOnly]);
      } else {
        setFamilyMembers(INITIAL_FAMILY);
      }
    } catch (e) {
      setFamilyMembers(INITIAL_FAMILY);
    }
  };

  // Load User Passes dynamically
  const loadUserPasses = () => {
    try {
      const stored: UserPass[] = JSON.parse(localStorage.getItem("mana_user_passes") || "[]");
      if (useMock) {
        const existingIds = new Set(INITIAL_PASSES.map((p) => p.id));
        const customOnly = stored.filter((s) => !existingIds.has(s.id));
        setPassesList([...INITIAL_PASSES, ...customOnly]);
      } else {
        setPassesList(stored);
      }
    } catch {
      setPassesList(useMock ? INITIAL_PASSES : []);
    }
  };

  useEffect(() => {
    fetchLiveDataFromBackend();
    loadFamilyMembers();
    loadUserPasses();

    window.addEventListener("mana_activities_updated", fetchLiveDataFromBackend);
    window.addEventListener("mana_family_updated", loadFamilyMembers);

    return () => {
      window.removeEventListener("mana_activities_updated", fetchLiveDataFromBackend);
      window.removeEventListener("mana_family_updated", loadFamilyMembers);
    };
  }, [useMock]);

  // Compute dynamic counters for Quick Actions
  const poojaCount = useMemo(() => activitiesList.filter((a) => a.category === "Pooja").length, [activitiesList]);
  const foodCount = useMemo(() => activitiesList.filter((a) => a.category === "Food").length, [activitiesList]);
  const culturalCount = useMemo(() => activitiesList.filter((a) => a.category === "Cultural").length, [activitiesList]);
  const compCount = useMemo(() => activitiesList.filter((a) => a.category === "Competitions").length, [activitiesList]);

  const dynamicQuickActions = useMemo(() => {
    const volunteerBadge = useMock
      ? "12 Teams Duty"
      : liveStats?.totalVolunteers !== undefined && liveStats.totalVolunteers > 0
      ? `${liveStats.totalVolunteers} Duties`
      : "0 Duties";

    const donateBadge = useMock
      ? "₹6.2L Raised"
      : liveStats?.totalRevenue !== undefined && liveStats.totalRevenue > 0
      ? `₹${(liveStats.totalRevenue).toLocaleString()} Raised`
      : "₹0 Raised";

    const foodBadge = useMock
      ? "4.2K Free"
      : liveStats?.foodPlatesCount !== undefined && liveStats.foodPlatesCount > 0
      ? `${liveStats.foodPlatesCount.toLocaleString()} Plates`
      : "0 Served";

    const auctionBadge = useMock
      ? "₹18,500 Bid"
      : liveStats?.auctionRevenue !== undefined && liveStats.auctionRevenue > 0
      ? `₹${liveStats.auctionRevenue.toLocaleString()} Bid`
      : "No Bids";

    return [
      {
        id: "pooja",
        label: "Pooja & Seva",
        icon: Flame,
        color: "bg-amber-500/10 text-amber-600 border-amber-300/30",
        badge: poojaCount > 0 ? `${poojaCount} Live Slot${poojaCount === 1 ? "" : "s"}` : "0 Slots",
        category: "Pooja",
      },
      {
        id: "lunchDinner",
        label: "Lunch / Dinner",
        icon: Utensils,
        color: "bg-orange-500/10 text-orange-600 border-orange-300/30",
        badge: foodCount > 0 ? `${foodCount} Meal Slot${foodCount === 1 ? "" : "s"}` : foodBadge,
        category: "Food",
      },
      {
        id: "cultural",
        label: "Cultural",
        icon: Music,
        color: "bg-purple-500/10 text-purple-600 border-purple-300/30",
        badge: culturalCount > 0 ? `${culturalCount} Stage Show${culturalCount === 1 ? "" : "s"}` : "0 Shows",
        category: "Cultural",
      },
      {
        id: "competitions",
        label: "Competitions",
        icon: Trophy,
        color: "bg-blue-500/10 text-blue-600 border-blue-300/30",
        badge: compCount > 0 ? `${compCount} Contest${compCount === 1 ? "" : "s"}` : "0 Contests",
        category: "Competitions",
      },
      {
        id: "passes",
        label: "My Passes",
        icon: Ticket,
        color: "bg-indigo-500/10 text-indigo-600 border-indigo-300/30",
        badge: `${passesList.length} Active`,
        action: "passes",
      },
      {
        id: "volunteer",
        label: "Volunteer",
        icon: ShieldCheck,
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-300/30",
        badge: volunteerBadge,
        category: "Volunteer",
      },
      {
        id: "donate",
        label: "Donate Seva",
        icon: Heart,
        color: "bg-rose-500/10 text-rose-600 border-rose-300/30",
        badge: donateBadge,
        category: "Donation",
      },
      {
        id: "auction",
        label: "Laddu Auction",
        icon: Gavel,
        color: "bg-cyan-500/10 text-cyan-600 border-cyan-300/30",
        badge: auctionBadge,
        category: "Auction",
      },
    ];
  }, [poojaCount, foodCount, culturalCount, compCount, passesList.length, useMock, liveStats]);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const handleAddFamilyMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;

    const createdMember: FamilyMember = {
      id: "fam-" + Date.now(),
      name: newMember.name.trim(),
      relation: newMember.relation,
      age: Number(newMember.age) || 18,
      avatar: newMember.avatar,
    };

    const updatedList = [...familyMembers, createdMember];
    setFamilyMembers(updatedList);

    try {
      localStorage.setItem("mana_family_members", JSON.stringify(updatedList));
      window.dispatchEvent(new Event("mana_family_updated"));
    } catch (err) {
      console.warn("Storage save error:", err);
    }

    setSelectedMembers((prev) => [...prev, createdMember.id]);
    setNewMember({ name: "", relation: "Son", age: "", avatar: "👦" });
    setShowAddMemberModal(false);
  };

  const handleBookingSubmit = () => {
    if (!selectedActivity) return;
    const attendingNames = familyMembers
      .filter((f) => selectedMembers.includes(f.id))
      .map((f) => f.name)
      .join(", ");

    const newPass: UserPass = {
      id: "pass-" + Date.now(),
      passType: `${selectedActivity.category} Registration Pass`,
      title: selectedActivity.title,
      participantName: attendingNames || "Sandeep Verma",
      regId: `MNA-2026-${selectedActivity.category.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: selectedActivity.date,
      time: selectedActivity.time,
      venue: selectedActivity.venue,
      status: "CONFIRMED",
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MNA-2026-REG-${Date.now()}`,
    };
    setPassesList((prev) => [newPass, ...prev]);
    alert(`Success! Registered for ${selectedActivity.title}. E-Pass issued to ${attendingNames}!`);
    setSelectedActivity(null);
    setActiveTab("passes");
  };

  const filteredActivities = activitiesList.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.venue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategoryFilter ? a.category === selectedCategoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full max-w-7xl mx-auto bg-card border border-border text-card-foreground font-sans rounded-2xl overflow-hidden shadow-xs pb-12 relative">
      <div className="p-4 sm:p-6 space-y-6">
        {activeTab === "home" && (
          <>
            {/* Search Input on Mobile */}
            <div className="md:hidden relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Pooja, Cultural, Passes, Events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-muted/60 focus:bg-background text-xs text-foreground placeholder:text-muted-foreground pl-9 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>

            {/* Hero Community Event Banner (Matching Prompt HTML Design with Dynamic Data) */}
            <div
              className="relative rounded-2xl overflow-hidden shadow-md transition-all duration-300 border border-indigo-900/20"
              style={{
                background:
                  "linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(124, 58, 237) 50%, rgb(99, 102, 241) 100%)",
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none z-0"
                style={{
                  backgroundImage: "radial-gradient(circle, rgb(255, 255, 255) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              <div
                className="absolute right-0 top-0 w-64 h-full rounded-full opacity-15 blur-3xl pointer-events-none z-0"
                style={{
                  background: "radial-gradient(circle, rgb(254, 243, 199) 0%, transparent 70%)",
                  transform: "translate(20%, -20%)",
                }}
              />
              <div className="relative z-10 px-4 py-3 sm:px-5 sm:py-3.5 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-xl shrink-0 shadow-xs">
                    📅
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-200 border border-amber-300/30 uppercase tracking-wider">
                        🔥 Community Event
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 text-[10px] font-bold border border-slate-400/30">
                        <span className={`w-1.5 h-1.5 rounded-full ${activitiesList.length > 0 ? "bg-emerald-400" : "bg-slate-400"}`} />
                        {activitiesList.length > 0 ? `${activitiesList.length} Events Available` : "0 Events Available"}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-md truncate">
                      {activitiesList.length > 0
                        ? (activitiesList[0]?.title || "Maha Ganapathi Archana & Silver Shield Pooja")
                        : "No Events Created Yet"}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-white/75 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-300" />
                        {activitiesList.length > 0 ? (activitiesList[0]?.venue || "Main Temple Mandap, Gate 1") : "Community Center"}
                      </span>
                      <span className="text-white/30">·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-200" />
                        {activitiesList.length > 0 ? (activitiesList[0]?.date || "22 Aug 2026") : "Upcoming"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-2.5 lg:pt-0 border-white/10">
                  <div className="text-[11px] font-semibold text-white/70 italic">
                    {activitiesList.length > 0 ? "Select an activity below to register" : "No active timer"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-amber-200 bg-amber-400/20 px-3 py-1 rounded-xl border border-amber-300/30">
                      {activitiesList.length > 0
                        ? "⚡ 2-Tap Booking Active"
                        : "Create an event in Events module to open registrations"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Collapsible Family Devotees Section */}
            <div className="bg-card border border-border rounded-2xl p-3.5 shadow-xs space-y-3 transition-all">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowFamily(!showFamily)}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                      Family Devotees ({familyMembers.length})
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        ({showFamily ? "Click to collapse" : "Click to view members"})
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddMemberModal(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold border border-primary/20 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Family Member
                  </button>

                  <button
                    type="button"
                    className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                  >
                    {showFamily ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {showFamily && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-border animate-fadeIn">
                  {familyMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{member.avatar}</span>
                        <div>
                          <p className="text-xs font-bold text-foreground">{member.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {member.relation} • Age {member.age}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Member Actions Grid (Live REST API & Mock Toggle Indicator) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  User View (Quick Actions)
                  {useMock ? (
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      ⚡ Mock Data Mode
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                      {loadingApiData ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-emerald-600" /> Fetching Live API...
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live API Active
                        </>
                      )}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {selectedCategoryFilter && (
                    <button
                      onClick={() => setSelectedCategoryFilter(null)}
                      className="text-[10.5px] font-bold text-rose-600 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Clear Filter: {selectedCategoryFilter}
                    </button>
                  )}
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    Interactive Dynamic Cards
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                {dynamicQuickActions.map((action) => {
                  const Icon = action.icon;
                  const isSelected = selectedCategoryFilter === action.category;
                  return (
                    <button
                      key={action.id}
                      onClick={() => {
                        if (action.action === "passes") {
                          setActiveTab("passes");
                        } else if (action.category) {
                          setSelectedCategoryFilter(
                            selectedCategoryFilter === action.category ? null : action.category
                          );
                        }
                      }}
                      className={`flex flex-col items-center p-3 rounded-2xl border transition-all hover:scale-[1.03] text-center cursor-pointer shadow-xs group ${
                        isSelected
                          ? "bg-primary/15 border-primary ring-2 ring-primary/30"
                          : "bg-card hover:bg-accent/10 border-border hover:border-primary/40"
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl ${action.color} border flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-extrabold text-foreground leading-tight block truncate w-full">
                        {action.label}
                      </span>
                      <span className="text-[9.5px] font-extrabold text-primary mt-1 block truncate w-full">
                        {action.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Featured Sevas & Events (Dynamic Filtered List) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  Featured Sevas, Cultural &amp; Competitions ({filteredActivities.length})
                  {selectedCategoryFilter && (
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      Category: {selectedCategoryFilter}
                    </span>
                  )}
                </h3>
                {selectedCategoryFilter ? (
                  <button
                    onClick={() => setSelectedCategoryFilter(null)}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    View All Categories
                  </button>
                ) : (
                  <span className="text-xs text-primary font-bold">All Active Registrations</span>
                )}
              </div>

              {filteredActivities.length === 0 ? (
                <div className="p-8 text-center bg-card border border-border rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-foreground">
                      {activitiesList.length === 0
                        ? "No Events or Activities Created Yet"
                        : "No activities found in this category."}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      {activitiesList.length === 0
                        ? "Events and seva activities will appear here once published by the organizers. You can also toggle Mock Data mode in the top header to preview sample events."
                        : "Try clearing your category filter to view other scheduled sevas."}
                    </p>
                  </div>
                  {selectedCategoryFilter && (
                    <button
                      onClick={() => setSelectedCategoryFilter(null)}
                      className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl cursor-pointer shadow-xs hover:bg-primary/90"
                    >
                      Show All Activities
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      className="bg-card rounded-2xl border border-border p-4 flex gap-4 shadow-xs hover:shadow-md hover:border-primary/40 transition-all"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-3xl flex items-center justify-center shrink-0 border border-primary/20">
                        {act.image}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-[10.5px]">
                            <span className="font-extrabold uppercase text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20">
                              {act.category}
                            </span>
                            <span className="text-muted-foreground font-bold">{act.availableSeats} slots left</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-foreground mt-1.5 line-clamp-1">
                            {act.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                            {act.date} • {act.time}
                          </p>
                          <p className="text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-1">{act.venue}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-xs sm:text-sm font-mono font-black text-foreground">
                            {act.fee === 0 ? "FREE" : `₹${act.fee}`}
                          </span>
                          <button
                            onClick={() => setSelectedActivity(act)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Ticket className="w-3.5 h-3.5" /> Book / Register
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── PASSES VIEW TAB ─── */}
        {activeTab === "passes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-black text-foreground">My Active E-Passes &amp; Tokens ({passesList.length})</h3>
                <p className="text-xs text-muted-foreground">Digital gate passes for event entry &amp; seva participation</p>
              </div>
              <button
                onClick={() => setActiveTab("home")}
                className="px-3 py-1.5 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition-colors cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {passesList.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div>
                        <span className="text-[10px] font-extrabold text-primary uppercase block">{p.passType}</span>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">{p.title}</h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {p.status}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Attendee: <strong className="text-foreground">{p.participantName}</strong></p>
                      <p>Date &amp; Time: <strong className="text-foreground">{p.date} • {p.time}</strong></p>
                      <p className="font-mono text-[10.5px] text-muted-foreground/70">Reg ID: {p.regId}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowQRPass(p)}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                  >
                    <QrCode className="w-4 h-4" /> View Entry QR Pass
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── ADD FAMILY MEMBER MODAL ─── */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddFamilyMemberSubmit}
            className="w-full max-w-sm bg-card border border-border text-card-foreground rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Add Dynamic Family Devotee
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="e.g. Ramesh Verma"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Relationship *
                  </label>
                  <select
                    value={newMember.relation}
                    onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Relative">Relative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="110"
                    required
                    value={newMember.age}
                    onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                    placeholder="25"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Select Avatar Icon
                </label>
                <div className="flex items-center gap-2">
                  {["👤", "👩", "👦", "👧", "👨‍🦳", "👵"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewMember({ ...newMember, avatar: emoji })}
                      className={`text-xl p-2 rounded-xl border transition-transform cursor-pointer ${
                        newMember.avatar === emoji
                          ? "bg-primary/20 border-primary scale-110 shadow-xs"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Save Family Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MEMBER REGISTRATION MODAL ─── */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border text-card-foreground rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {selectedActivity.category} Registration
                </span>
                <h3 className="text-sm font-black text-foreground mt-1">{selectedActivity.title}</h3>
              </div>
              <button onClick={() => setSelectedActivity(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
                <p className="font-bold text-foreground">{selectedActivity.description}</p>
                <p className="text-muted-foreground">📅 {selectedActivity.date} • 🕒 {selectedActivity.time}</p>
                <p className="text-muted-foreground">📍 {selectedActivity.venue}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Select Attending Family Devotees ({familyMembers.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Member
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {familyMembers.map((member) => {
                    const isChecked = selectedMembers.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => toggleMember(member.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background border-border text-foreground hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{member.avatar}</span>
                          <div>
                            <p className="text-xs font-bold">{member.name}</p>
                            <p className="text-[10px] opacity-80">{member.relation} (Age {member.age})</p>
                          </div>
                        </div>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold block">Total Booking Fee</span>
                <span className="text-sm font-mono font-black text-foreground">
                  {selectedActivity.fee === 0 ? "FREE" : `₹${selectedActivity.fee * selectedMembers.length}`}
                </span>
              </div>
              <button
                onClick={handleBookingSubmit}
                disabled={selectedMembers.length === 0}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                Confirm &amp; Issue E-Pass <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── QR GATE PASS MODAL ─── */}
      {showQRPass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border text-card-foreground rounded-2xl p-6 space-y-4 shadow-2xl text-center animate-fadeIn relative">
            <button
              onClick={() => setShowQRPass(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 inline-block">
              <QrCode className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">{showQRPass.passType}</span>
              <h3 className="text-base font-black text-foreground mt-0.5">{showQRPass.title}</h3>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img src={showQRPass.qrCodeUrl} alt="QR Gate Pass" className="w-40 h-40 mx-auto" />
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Attendee: <strong className="text-foreground">{showQRPass.participantName}</strong></p>
              <p className="font-mono text-[11px] text-primary font-bold">{showQRPass.regId}</p>
            </div>

            <button
              onClick={() => {
                alert("E-Pass downloaded to your device gallery!");
                setShowQRPass(null);
              }}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" /> Download Digital Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
