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
  Trash2,
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

const INITIAL_PASSES: UserPass[] = [];

export function EventMemberView() {
  const { user } = useAuth();
  const { useMock } = useEventMock();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "passes" | "auction">("home");
  const [showQRPass, setShowQRPass] = useState<UserPass | null>(null);
  const [showFamily, setShowFamily] = useState(false);
  const [passesList, setPassesList] = useState<UserPass[]>(() => (useMock ? INITIAL_PASSES : []));
  const [activitiesList, setActivitiesList] = useState<Activity[]>(() => (useMock ? INITIAL_ACTIVITIES : []));
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [liveStats, setLiveStats] = useState<DashboardStatsResponse | null>(null);
  const [loadingApiData, setLoadingApiData] = useState(false);
  const [loadingFamily, setLoadingFamily] = useState(false);

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

      setActivitiesList(fetchedActivities);
    } catch (err) {
      console.warn("Failed to fetch live API events:", err);
      setActivitiesList([]);
    } finally {
      setLoadingApiData(false);
    }
  };

  // Load family members dynamically from database / mock
  // Load family members dynamically from database & include logged-in member
  const loadFamilyMembers = async () => {
    setLoadingFamily(true);

    const primaryDevotee: FamilyMember = {
      id: "self",
      name: user?.fullName || (user?.email ? user.email.split("@")[0] : "Primary Devotee"),
      relation: "Myself (Head)",
      age: user?.dateOfBirth
        ? Math.max(18, new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear())
        : 30,
      avatar: user?.gender === "Female" ? "👩" : "👨",
    };

    try {
      try {
        localStorage.removeItem("mana_family_members");
      } catch {}

      const dbMembers = await eventService.getFamilyMembers();
      if (Array.isArray(dbMembers) && dbMembers.length > 0) {
        const dummyNames = new Set([
          "Sunita Sharma", "Aarav Sharma", "Ananya Sharma",
          "Sandeep Verma", "Ananya Verma", "Rahul Verma", "Priya Verma"
        ]);
        const mapped: FamilyMember[] = dbMembers
          .filter((m: any) => m && m.name && !dummyNames.has(m.name.trim()))
          .map((m: any) => ({
            id: String(m.id ?? m.name),
            name: m.name,
            relation: m.relation || "Family",
            age: Number(m.age) || 25,
            avatar: m.avatar || "👤",
          }));

        // Filter out any duplicate self/primary entries from DB
        const additionalMembers = mapped.filter(
          (m) =>
            m.name.trim().toLowerCase() !== primaryDevotee.name.trim().toLowerCase() &&
            !m.relation.toLowerCase().includes("myself") &&
            !m.relation.toLowerCase().includes("head")
        );

        const combinedList = [primaryDevotee, ...additionalMembers];
        setFamilyMembers(combinedList);
        setSelectedMembers(combinedList.map((m) => m.id));
        setLoadingFamily(false);
        return;
      }
    } catch (err) {
      console.warn("Could not fetch family members from database API:", err);
    }

    // Default to the logged-in user as the primary devotee
    setFamilyMembers([primaryDevotee]);
    setSelectedMembers([primaryDevotee.id]);
    setLoadingFamily(false);
  };

  // Load User Passes dynamically from database API / mock
  const loadUserPasses = async () => {
    if (useMock) {
      try {
        const stored: UserPass[] = JSON.parse(localStorage.getItem("mana_user_passes") || "[]");
        setPassesList(stored);
      } catch {
        setPassesList([]);
      }
      return;
    }

    try {
      const liveRegs = await eventService.getMyRegistrations();
      if (Array.isArray(liveRegs) && liveRegs.length > 0) {
        const mappedPasses: UserPass[] = liveRegs.map((r: any) => ({
          id: String(r.id),
          passType: r.passType || `${r.category || "Event"} Registration Pass`,
          title: r.activityTitle || "Community Event",
          participantName: r.participantName || "Devotee",
          regId: r.regCode || `MNA-2026-${r.id}`,
          date: r.eventDate || "Upcoming",
          time: r.eventTime || "Scheduled",
          venue: r.venue || "Community Venue",
          status: (r.status === "PENDING APPROVAL" ? "PENDING APPROVAL" : "CONFIRMED"),
          qrCodeUrl: r.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${r.regCode || r.id}`,
        }));
        setPassesList(mappedPasses);
        return;
      }
    } catch (err) {
      console.warn("Could not fetch user registrations from API:", err);
    }

    setPassesList([]);
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
  }, [useMock, user]);

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

  const handleDeleteFamilyMember = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!useMock && !id.startsWith("fam-") && id !== "self") {
      try {
        await eventService.deleteFamilyMember(Number(id));
      } catch (err) {
        console.error("Failed to delete devotee from database:", err);
      }
    }
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
    setSelectedMembers((prev) => prev.filter((mid) => mid !== id));
  };

  const handleAddFamilyMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;

    const payload = {
      name: newMember.name.trim(),
      relation: newMember.relation,
      age: Number(newMember.age) || 18,
      avatar: newMember.avatar,
      status: "ACTIVE",
    };

    let createdId = "fam-" + Date.now();

    if (!useMock) {
      try {
        const saved = await eventService.addFamilyMember(payload);
        if (saved && saved.id) {
          createdId = String(saved.id);
        }
      } catch (err) {
        console.error("Failed to save devotee to database:", err);
      }
    }

    const createdMember: FamilyMember = {
      id: createdId,
      name: payload.name,
      relation: payload.relation,
      age: payload.age,
      avatar: payload.avatar,
    };

    const updatedList = [...familyMembers, createdMember];
    setFamilyMembers(updatedList);
    setSelectedMembers((prev) => [...prev, createdMember.id]);
    setNewMember({ name: "", relation: "Son", age: "", avatar: "👦" });
    setShowAddMemberModal(false);
  };

  const handleBookingSubmit = async () => {
    if (!selectedActivity) return;
    const attendingNames = familyMembers
      .filter((f) => selectedMembers.includes(f.id))
      .map((f) => f.name)
      .join(", ");

    const attendeeLabel = attendingNames || user?.fullName || (user?.email ? user.email.split("@")[0] : "Devotee");
    const regCode = `MNA-2026-${(selectedActivity.category || "EVT").toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const passPayload = {
      regCode,
      activityId: selectedActivity.id,
      activityTitle: selectedActivity.title,
      category: selectedActivity.category,
      passType: `${selectedActivity.category} Registration Pass`,
      participantName: attendeeLabel,
      attendingDevotees: attendingNames,
      devoteeCount: Math.max(1, selectedMembers.length),
      eventDate: selectedActivity.date,
      eventTime: selectedActivity.time,
      venue: selectedActivity.venue,
      bookingFee: (selectedActivity.fee || 0) * Math.max(1, selectedMembers.length),
      paymentStatus: selectedActivity.fee === 0 ? "FREE" : "PAID",
      status: "CONFIRMED",
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${regCode}`,
    };

    let createdId = "pass-" + Date.now();

    if (!useMock) {
      try {
        const saved = await eventService.createRegistration(passPayload);
        if (saved && saved.id) {
          createdId = String(saved.id);
        }
      } catch (err) {
        console.error("Failed to save event registration to database:", err);
      }
    }

    const newPass: UserPass = {
      id: createdId,
      passType: passPayload.passType,
      title: passPayload.activityTitle,
      participantName: passPayload.participantName,
      regId: regCode,
      date: passPayload.eventDate,
      time: passPayload.eventTime,
      venue: passPayload.venue,
      status: "CONFIRMED",
      qrCodeUrl: passPayload.qrCodeUrl,
    };

    setPassesList((prev) => [newPass, ...prev]);
    alert(`Success! Registered for ${selectedActivity.title}. E-Pass issued to ${attendeeLabel}!`);
    setSelectedActivity(null);
    setActiveTab("passes");
  };

  const handleDownloadPDFPass = (pass: UserPass) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups in your browser to download/print the PDF E-Pass.");
      return;
    }

    const passHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>E-Pass Ticket - ${pass.regId}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .ticket-card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid #4f46e5; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(79, 70, 229, 0.12); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 28px 24px; text-align: center; position: relative; }
    .badge { display: inline-block; background: rgba(255,255,255,0.25); color: #ffffff; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.3); }
    .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; font-weight: 500; }
    .body-content { padding: 28px 24px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
    .info-box { background: #f8fafc; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .info-box.full { grid-column: span 2; }
    .label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .value { font-size: 14px; font-weight: 800; color: #0f172a; word-break: break-word; }
    .value.highlight { color: #4f46e5; }
    .qr-container { text-align: center; background: #f1f5f9; padding: 24px; border-radius: 16px; border: 2px dashed #cbd5e1; margin: 10px 0; }
    .qr-code { width: 170px; height: 170px; margin: 0 auto; display: block; background: #ffffff; padding: 8px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .reg-code { font-family: monospace; font-size: 14px; font-weight: 900; color: #4f46e5; margin-top: 12px; letter-spacing: 0.5px; }
    .instructions { font-size: 11px; color: #64748b; margin-top: 6px; font-weight: 600; }
    .footer { border-top: 1px dashed #e2e8f0; padding: 16px 24px; background: #fafafa; text-align: center; }
    .status-stamp { font-size: 12px; font-weight: 900; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; }
    .terms { font-size: 10.5px; color: #94a3b8; margin-top: 4px; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .ticket-card { box-shadow: none; border-color: #000000; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="header">
      <div class="badge">OFFICIAL GATE ENTRY E-PASS</div>
      <h1>Shree Ganesh Utsav 2026</h1>
      <p>Mana Community Executive Committee • Digital Verification Voucher</p>
    </div>
    <div class="body-content">
      <div class="info-grid">
        <div class="info-box">
          <div class="label">Pass Category</div>
          <div class="value highlight">${pass.passType}</div>
        </div>
        <div class="info-box">
          <div class="label">Event / Program</div>
          <div class="value">${pass.title}</div>
        </div>
        <div class="info-box">
          <div class="label">Devotee / Attendee</div>
          <div class="value">${pass.participantName}</div>
        </div>
        <div class="info-box">
          <div class="label">Date & Time</div>
          <div class="value">${pass.date} • ${pass.time}</div>
        </div>
        <div class="info-box full">
          <div class="label">Assigned Venue & Entry Gate</div>
          <div class="value">${pass.venue}</div>
        </div>
      </div>

      <div class="qr-container">
        <img src="${pass.qrCodeUrl}" class="qr-code" alt="Gate Verification QR Code" />
        <div class="reg-code">${pass.regId}</div>
        <div class="instructions">Present QR Code at Security Scanner Desk for instant entry & prasadam verification</div>
      </div>
    </div>
    <div class="footer">
      <div class="status-stamp">✓ CONFIRMED &amp; VALIDATED PASS</div>
      <div class="terms">Please keep a digital or printed PDF copy ready at gate entry. Non-transferable.</div>
    </div>
  </div>
  <div class="no-print" style="text-align: center; margin-top: 24px;">
    <button onclick="window.print()" style="padding: 12px 28px; background: linear-gradient(to right, #4f46e5, #7c3aed); color: #ffffff; border: none; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
      🖨️ Print / Save as PDF
    </button>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>
    `;

    printWindow.document.write(passHtml);
    printWindow.document.close();
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
    <div className="w-full max-w-7xl mx-auto bg-card border border-border text-card-foreground font-sans rounded-2xl overflow-hidden shadow-xs pb-20 md:pb-12 relative">
      <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
        {activeTab === "home" && (
          <>
            {/* Search & Filter Bar on Mobile */}
            <div className="md:hidden space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Pooja, Meals, Passes, Contests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/70 focus:bg-background text-xs text-foreground placeholder:text-muted-foreground pl-9 pr-8 py-2.5 rounded-2xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Hero Community Event Banner (Interactive Mobile Optimized) */}
            <div
              className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md transition-all duration-300 border border-indigo-900/20"
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
                className="absolute right-0 top-0 w-64 h-full rounded-full opacity-20 blur-3xl pointer-events-none z-0"
                style={{
                  background: "radial-gradient(circle, rgb(254, 243, 199) 0%, transparent 70%)",
                  transform: "translate(20%, -20%)",
                }}
              />
              <div className="relative z-10 p-4 sm:p-5 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                    🪔
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-black bg-amber-400/25 text-amber-200 border border-amber-300/30 uppercase tracking-wider shadow-2xs">
                        🔥 Community Event
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/30 text-slate-200 text-[9.5px] sm:text-[10px] font-bold border border-white/15 backdrop-blur-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${activitiesList.length > 0 ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                        {activitiesList.length > 0 ? `${activitiesList.length} Events Available` : "0 Events Available"}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black text-white leading-snug drop-shadow-md truncate">
                      {activitiesList.length > 0
                        ? (activitiesList[0]?.title || "Maha Ganapathi Archana & Silver Shield Pooja")
                        : "No Events Created Yet"}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-medium text-white/80 mt-1">
                      <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-none">
                        <MapPin className="w-3 h-3 text-amber-300 shrink-0" />
                        <span className="truncate">{activitiesList.length > 0 ? (activitiesList[0]?.venue || "Main Temple Mandap, Gate 1") : "Community Center"}</span>
                      </span>
                      <span className="text-white/40">·</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3 text-indigo-200 shrink-0" />
                        {activitiesList.length > 0 ? (activitiesList[0]?.date || "22 Aug 2026") : "Upcoming"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-2 border-t lg:border-t-0 pt-2.5 lg:pt-0 border-white/15">
                  <div className="text-[10.5px] sm:text-[11px] font-semibold text-white/80 italic truncate">
                    {activitiesList.length > 0 ? "⚡ 2-Tap Booking Active" : "No active timer"}
                  </div>
                  {activitiesList.length > 0 && (
                    <button
                      onClick={() => {
                        const el = document.getElementById("activities-grid-section");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-3 py-1 bg-amber-400/25 hover:bg-amber-400/35 text-amber-100 text-[11px] font-bold rounded-xl border border-amber-300/40 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                    >
                      Book Now ↓
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Collapsible Family Devotees Section */}
            <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-xs space-y-3 transition-all">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowFamily(!showFamily)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      Family Devotees ({familyMembers.length})
                      <span className="text-[10px] text-muted-foreground font-normal hidden sm:inline">
                        ({showFamily ? "Tap to collapse" : "Tap to view"})
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddMemberModal(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[10.5px] sm:text-[11px] font-bold border border-primary/20 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add Family Member</span>
                    <span className="sm:hidden">Add</span>
                  </button>

                  <button
                    type="button"
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                  >
                    {showFamily ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {showFamily && (
                <div>
                  {loadingFamily ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted-foreground border-t border-border">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Loading registered family devotees...</span>
                    </div>
                  ) : familyMembers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground border-t border-border">
                      No registered family devotees yet. Tap{" "}
                      <strong className="text-primary cursor-pointer underline" onClick={() => setShowAddMemberModal(true)}>
                        + Add Family Member
                      </strong>{" "}
                      to register devotees.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-border animate-fadeIn">
                      {familyMembers.map((member) => {
                        const isPrimary = member.id === "self" || member.relation.includes("Myself") || member.relation.includes("Head");
                        return (
                          <div
                            key={member.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                              isPrimary
                                ? "bg-primary/5 border-primary/30 shadow-2xs"
                                : "bg-muted/50 border-border/70 hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xl shrink-0">{member.avatar}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-foreground truncate">{member.name}</p>
                                  {isPrimary && (
                                    <span className="text-[8.5px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 px-1.5 py-0.2 rounded">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium truncate">
                                  {member.relation} • Age {member.age}
                                  {isPrimary && (user?.flatNo || user?.block) && ` • Flat ${user?.block ? `${user?.block}-` : ""}${user?.flatNo || ""}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border ${
                                isPrimary
                                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                                  : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                              }`}>
                                {isPrimary ? "Primary Devotee" : "Active"}
                              </span>
                              {!isPrimary && (
                                <button
                                  type="button"
                                  title="Remove devotee"
                                  onClick={(e) => handleDeleteFamilyMember(member.id, e)}
                                  className="p-1 text-muted-foreground hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Member Actions Grid (Horizontal Mobile Scroll + Grid) */}
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Quick Actions</span>
                  {useMock ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      ⚡ Mock
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
                    </span>
                  )}
                </h3>
                {selectedCategoryFilter && (
                  <button
                    onClick={() => setSelectedCategoryFilter(null)}
                    className="text-[10px] sm:text-[10.5px] font-bold text-rose-600 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Clear: {selectedCategoryFilter}
                  </button>
                )}
              </div>

              {/* Mobile Swipeable / Desktop Responsive Touch Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
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
                      className={`flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all active:scale-95 sm:hover:scale-[1.03] text-center cursor-pointer shadow-2xs group select-none min-h-[95px] sm:min-h-[110px] ${
                        isSelected
                          ? "bg-primary/15 border-primary ring-2 ring-primary/30"
                          : "bg-card hover:bg-accent/10 border-border hover:border-primary/40"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${action.color} border flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform shrink-0`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="w-full mt-1.5 space-y-0.5">
                        <span className="text-[10.5px] sm:text-xs font-black text-foreground leading-tight block truncate w-full">
                          {action.label}
                        </span>
                        <span className="text-[8.5px] sm:text-[9.5px] font-bold text-primary block truncate w-full">
                          {action.badge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Featured Sevas & Events (Dynamic Filtered List) */}
            <div id="activities-grid-section" className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                  <Filter className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Scheduled Activities ({filteredActivities.length})</span>
                  {selectedCategoryFilter && (
                    <span className="text-[10px] sm:text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      {selectedCategoryFilter}
                    </span>
                  )}
                </h3>
                {selectedCategoryFilter ? (
                  <button
                    onClick={() => setSelectedCategoryFilter(null)}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Show All
                  </button>
                ) : (
                  <span className="text-xs text-primary font-bold hidden sm:inline">All Active Registrations</span>
                )}
              </div>

              {filteredActivities.length === 0 ? (
                <div className="p-6 sm:p-8 text-center bg-card border border-border rounded-2xl space-y-3 shadow-2xs">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      className="bg-card rounded-2xl border border-border p-3.5 sm:p-4 flex gap-3 sm:gap-4 shadow-xs hover:shadow-md hover:border-primary/40 transition-all group"
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 text-2xl sm:text-3xl flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs group-hover:scale-105 transition-transform">
                        {act.image}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-[10px] sm:text-[10.5px]">
                            <span className="font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                              {act.category}
                            </span>
                            <span className="text-muted-foreground font-bold text-[10px]">{act.availableSeats} slots left</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-black text-foreground mt-1 line-clamp-1">
                            {act.title}
                          </h4>
                          <p className="text-[10.5px] sm:text-[11px] text-muted-foreground font-medium mt-0.5">
                            {act.date} • {act.time}
                          </p>
                          <p className="text-[10.5px] sm:text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-1">{act.venue}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-xs sm:text-sm font-mono font-black text-foreground">
                            {act.fee === 0 ? "FREE" : `₹${act.fee}`}
                          </span>
                          <button
                            onClick={() => setSelectedActivity(act)}
                            className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
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
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-black text-foreground">My Active E-Passes &amp; Tokens ({passesList.length})</h3>
                <p className="text-xs text-muted-foreground">Digital gate passes for event entry &amp; seva participation</p>
              </div>
              <button
                onClick={() => setActiveTab("home")}
                className="px-3 py-1.5 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition-colors cursor-pointer"
              >
                ← Back
              </button>
            </div>

            {passesList.length === 0 ? (
              <div className="p-8 text-center bg-card border border-border rounded-2xl space-y-3">
                <Ticket className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">No Passes Issued Yet</p>
                <p className="text-xs text-muted-foreground">Register for any Pooja, Cultural or Competition event to get your QR E-Pass.</p>
                <button
                  onClick={() => setActiveTab("home")}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl cursor-pointer"
                >
                  Browse Events
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {passesList.map((p) => (
                  <div key={p.id} className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 flex flex-col justify-between hover:border-primary/40 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div>
                          <span className="text-[10px] font-extrabold text-primary uppercase block">{p.passType}</span>
                          <h4 className="text-xs sm:text-sm font-bold text-foreground">{p.title}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                          {p.status}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Attendee: <strong className="text-foreground">{p.participantName}</strong></p>
                        <p>Date &amp; Time: <strong className="text-foreground">{p.date} • {p.time}</strong></p>
                        <p className="font-mono text-[10.5px] text-muted-foreground/80">Reg ID: {p.regId}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowQRPass(p)}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-95"
                    >
                      <QrCode className="w-4 h-4" /> View Entry QR Pass
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── STICKY MOBILE BOTTOM NAVIGATION BAR ─── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => {
            setActiveTab("home");
            setSelectedCategoryFilter(null);
          }}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "home" && !selectedCategoryFilter ? "text-primary font-black scale-105" : "text-muted-foreground font-semibold"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[9.5px]">Home</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("home");
            setSelectedCategoryFilter("Pooja");
          }}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer ${
            selectedCategoryFilter === "Pooja" ? "text-amber-600 font-black scale-105" : "text-muted-foreground font-semibold"
          }`}
        >
          <Flame className="w-4 h-4" />
          <span className="text-[9.5px]">Pooja</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("home");
            setSelectedCategoryFilter("Food");
          }}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer ${
            selectedCategoryFilter === "Food" ? "text-orange-600 font-black scale-105" : "text-muted-foreground font-semibold"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span className="text-[9.5px]">Meals</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("passes");
            setSelectedCategoryFilter(null);
          }}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer relative ${
            activeTab === "passes" ? "text-indigo-600 font-black scale-105" : "text-muted-foreground font-semibold"
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span className="text-[9.5px]">Passes</span>
          {passesList.length > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-indigo-600"></span>
          )}
        </button>

        <button
          onClick={() => setShowFamily(!showFamily)}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer ${
            showFamily ? "text-primary font-black scale-105" : "text-muted-foreground font-semibold"
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[9.5px]">Family</span>
        </button>
      </div>

      {/* ─── ADD FAMILY MEMBER MODAL (MOBILE BOTTOM-SHEET) ─── */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleAddFamilyMemberSubmit}
            className="w-full max-w-sm bg-card border-t sm:border border-border text-card-foreground rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-1 mb-2 sm:hidden" />

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
                className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Save Family Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MEMBER REGISTRATION MODAL (MOBILE BOTTOM-SHEET) ─── */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-card border-t sm:border border-border text-card-foreground rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-1 mb-2 sm:hidden" />

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
                    Select Attending Devotees ({familyMembers.length})
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
                  {familyMembers.length === 0 ? (
                    <div className="p-4 text-center rounded-xl bg-muted/40 border border-dashed border-border space-y-2.5">
                      <p className="text-xs text-muted-foreground">
                        No registered family devotees in database yet.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          const selfName = user?.fullName || (user?.email ? user.email.split("@")[0] : "Myself (Head)");
                          const payload = {
                            name: selfName,
                            relation: "Myself (Head)",
                            age: 30,
                            avatar: "👤",
                            status: "ACTIVE",
                          };
                          let createdId = "fam-" + Date.now();
                          if (!useMock) {
                            try {
                              const saved = await eventService.addFamilyMember(payload);
                              if (saved && saved.id) createdId = String(saved.id);
                            } catch (e) {
                              console.error(e);
                            }
                          }
                          const newMem: FamilyMember = {
                            id: createdId,
                            name: payload.name,
                            relation: payload.relation,
                            age: payload.age,
                            avatar: payload.avatar,
                          };
                          setFamilyMembers([newMem]);
                          setSelectedMembers([newMem.id]);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Register as Myself ({user?.fullName || "Self"})
                      </button>
                    </div>
                  ) : (
                    familyMembers.map((member) => {
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
                    })
                  )}
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
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center gap-2 active:scale-95"
              >
                Confirm &amp; Issue E-Pass <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── QR GATE PASS MODAL (DIGITAL PASS WALLET) ─── */}
      {showQRPass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-sm bg-card border-t sm:border border-border text-card-foreground rounded-t-3xl sm:rounded-2xl p-6 space-y-4 shadow-2xl text-center animate-fadeIn relative">
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-2 mb-2 sm:hidden" />

            <button
              onClick={() => setShowQRPass(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 inline-block shadow-2xs">
              <QrCode className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">{showQRPass.passType}</span>
              <h3 className="text-base font-black text-foreground mt-0.5">{showQRPass.title}</h3>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block shadow-sm">
              <img src={showQRPass.qrCodeUrl} alt="QR Gate Pass" className="w-40 h-40 mx-auto" />
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Attendee: <strong className="text-foreground">{showQRPass.participantName}</strong></p>
              <p className="font-mono text-[11px] text-primary font-bold">{showQRPass.regId}</p>
            </div>

            <button
              onClick={() => {
                handleDownloadPDFPass(showQRPass);
                setShowQRPass(null);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-95"
            >
              <Download className="w-4 h-4" /> Download / Save PDF E-Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
