import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  Flame,
  Utensils,
  Music,
  Trophy,
  ShieldCheck,
  Star,
  Info,
  Phone,
  Sparkles,
  Shield,
  AlertCircle,
} from "lucide-react";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { eventService } from "../../../services/events/eventService";
import { eventSponsorService } from "../../../services/events/eventSponsorService";

export interface EventCompleteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  allActivities?: any[];
  onBookActivity?: (activity: any) => void;
  isAdmin?: boolean;
}

export const EventCompleteDetailsModal: React.FC<EventCompleteDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  allActivities = [],
  onBookActivity,
  isAdmin = false,
}) => {
  useEscapeKey(onClose, isOpen);

  const [activeTab, setActiveTab] = useState<"overview" | "poojas" | "meals" | "cultural" | "volunteers" | "sponsors">("overview");
  const [subPoojas, setSubPoojas] = useState<any[]>([]);
  const [subMeals, setSubMeals] = useState<any[]>([]);
  const [subCulturals, setSubCulturals] = useState<any[]>([]);
  const [subComps, setSubComps] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loadingSubEvents, setLoadingSubEvents] = useState(false);

  // Extract clean event properties
  const eventId = event?.id != null ? String(event.id).replace(/\D/g, "") : null;
  const rawId = event?.id != null ? String(event.id) : "";
  const eventTitle = event?.title || event?.name || "Community Festival Event";
  const eventCategory = event?.category || event?.type || "Grand Festival";
  const eventLocation = event?.venue || event?.location || "Main Community Grounds, Mandap Gate 1";
  const eventDescription = event?.description || "Experience the grand spiritual and cultural celebrations with traditional rituals, sacred pooja sevas, community feasts, cultural stage performances, and festive competitions for all residents.";
  const eventImage = event?.imageUrl || event?.image || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=80";
  const eventStartDate = event?.startDate || event?.date || "Upcoming";
  const eventEndDate = event?.endDate || (event?.startDate !== event?.date ? event?.date : null);
  const eventTime = event?.startTime && event?.endTime
    ? `${event.startTime} - ${event.endTime}`
    : (event?.time || event?.startTime || "06:00 AM – 10:00 PM");
  const eventCapacity = event?.capacity || event?.maxAttendees || 500;
  const eventRegistered = event?.attendees ?? event?.registrationCount ?? 0;
  const eventFee = event?.price != null && Number(event.price) > 0 ? Number(event.price) : 0;
  const organizerName = event?.organizerName || event?.organizer || "Temple Festival Committee";
  const organizerContact = event?.organizerContact || event?.contactPhone || "+91 98765 43210";
  const statusStr = String(event?.status || "ACTIVE").toUpperCase();
  const isCancelled = statusStr === "CANCELLED";

  // Fetch sub-events and connected modules dynamically
  useEffect(() => {
    if (!isOpen || !event) return;

    if (event.isStandalonePooja) {
      setSubPoojas([]);
      setSubMeals([]);
      setSubCulturals([]);
      setSubComps([]);
      setSponsors([]);
      return;
    }

    // Filter from allActivities passed as prop (strictly matched to this main event)
    const filteredPoojas: any[] = [];
    const filteredMeals: any[] = [];
    const filteredCulturals: any[] = [];
    const filteredComps: any[] = [];

    allActivities.forEach((act: any) => {
      const actMainId = act.mainEventId != null ? String(act.mainEventId).replace(/^event-/, "") : null;
      const actEventId = act.eventId != null ? String(act.eventId).replace(/^event-/, "") : null;
      const currentCleanId = eventId ? String(eventId).replace(/^event-/, "") : null;
      const isMatch = (currentCleanId && (actMainId === currentCleanId || actEventId === currentCleanId)) ||
                      (rawId && (actMainId === rawId || actEventId === rawId)) ||
                      (act.parentEventTitle && act.parentEventTitle.trim().toLowerCase() === eventTitle.trim().toLowerCase());

      const cat = (act.category || "").toLowerCase();
      const idStr = String(act.id || "").toLowerCase();

      if (isMatch) {
        if (cat.includes("pooja") || cat.includes("seva") || idStr.startsWith("pooja-")) {
          filteredPoojas.push(act);
        } else if (cat.includes("food") || cat.includes("meal") || cat.includes("annadanam") || idStr.startsWith("food-")) {
          filteredMeals.push(act);
        } else if (cat.includes("cultural") || idStr.startsWith("cult-")) {
          filteredCulturals.push(act);
        } else if (cat.includes("comp") || idStr.startsWith("comp-")) {
          filteredComps.push(act);
        }
      }
    });

    setSubPoojas(filteredPoojas);
    setSubMeals(filteredMeals);
    setSubCulturals(filteredCulturals);
    setSubComps(filteredComps);

    // Also fetch live API sub-events if available
    const fetchApiSubEvents = async () => {
      setLoadingSubEvents(true);
      try {
        const numId = eventId ? Number(eventId) : undefined;
        const [poojasRes, mealsRes, cultRes, compsRes, sponsorsRes] = await Promise.allSettled([
          numId ? eventService.getPoojaSevas(numId) : Promise.resolve([]),
          numId ? eventService.getLunchDinners(numId) : Promise.resolve([]),
          eventService.getCulturalEvents(),
          eventService.getCompetitions(),
          numId ? eventSponsorService.getSponsors(numId) : Promise.resolve([]),
        ]);

        if (poojasRes.status === "fulfilled" && Array.isArray(poojasRes.value) && poojasRes.value.length > 0) {
          const list = numId ? poojasRes.value.filter((p: any) => p.mainEventId == numId || p.eventId == numId) : [];
          if (list.length > 0) {
            setSubPoojas(list.map((p: any) => ({
              id: `pooja-${p.id}`,
              title: p.name || p.title || "Pooja Seva",
              category: "Pooja",
              date: p.startDate ? String(p.startDate) : (p.date || "Scheduled"),
              time: p.startTime || p.time || "Morning",
              venue: p.mandap || p.venue || eventLocation,
              fee: p.isFree ? 0 : Number(p.fee || 501),
              availableSeats: p.slots || 25,
              description: p.notes || `Pandit: ${p.pandit || "Temple Priest"}. Sankalpam included.`,
              pandit: p.pandit,
              mandap: p.mandap,
            })));
          }
        }

        if (mealsRes.status === "fulfilled" && Array.isArray(mealsRes.value) && mealsRes.value.length > 0) {
          const list = numId ? mealsRes.value.filter((m: any) => m.mainEventId == numId || m.eventId == numId) : mealsRes.value;
          if (list.length > 0) {
            setSubMeals(list.map((m: any) => ({
              id: `food-${m.id}`,
              title: m.name || m.mealType || "Maha Prasadam Lunch",
              category: "Food",
              date: m.date || "Daily",
              time: m.startTime && m.endTime ? `${m.startTime} - ${m.endTime}` : (m.startTime || "12:30 PM - 03:00 PM"),
              venue: m.venue || "Annadanam Dining Hall",
              fee: m.isFree ? 0 : Number(m.fee || 0),
              availableSeats: m.targetPlates || 500,
              description: `Caterer: ${m.caterer || "Food Committee"}. Menu: ${Array.isArray(m.menuItems) ? m.menuItems.join(", ") : "Traditional Pure Veg Feast"}.`,
              caterer: m.caterer,
              menuItems: m.menuItems,
            })));
          }
        }

        if (sponsorsRes.status === "fulfilled" && Array.isArray(sponsorsRes.value)) {
          setSponsors(sponsorsRes.value);
        }
      } catch (err) {
        console.warn("Could not load sub-events:", err);
      } finally {
        setLoadingSubEvents(false);
      }
    };

    fetchApiSubEvents();
  }, [isOpen, event, eventId, rawId, eventTitle, allActivities]);

  if (!isOpen || !event) return null;

  const totalSubEventsCount = subPoojas.length + subMeals.length + subCulturals.length + subComps.length;

  const handleBooking = (act: any) => {
    if (onBookActivity) {
      onClose();
      onBookActivity(act);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-card text-card-foreground border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp cursor-default my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── MODAL HERO HEADER ─── */}
        <div className="relative h-48 sm:h-60 w-full overflow-hidden shrink-0 bg-slate-900">
          {eventImage && (
            <img
              src={eventImage}
              alt={eventTitle}
              className="w-full h-full object-cover opacity-60 filter saturate-120"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/40" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white/90 hover:text-white flex items-center justify-center cursor-pointer transition-all border border-white/20 shadow-lg backdrop-blur-md z-20"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Badges & Titles */}
          <div className="absolute bottom-4 left-4 right-4 text-white z-10 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-300 border border-amber-400/40 backdrop-blur-md">
                🔥 {eventCategory}
              </span>
              {isCancelled ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-400/40 backdrop-blur-md flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Event Cancelled
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 backdrop-blur-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live / Active
                </span>
              )}
              {totalSubEventsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 backdrop-blur-md">
                  ✨ {totalSubEventsCount} Sub-Events &amp; Sevas
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
              {eventTitle}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                {eventStartDate}{eventEndDate && eventEndDate !== eventStartDate ? ` – ${eventEndDate}` : ""}
              </span>
              <span className="text-white/40">·</span>
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                {eventTime}
              </span>
              <span className="text-white/40">·</span>
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-300" />
                {eventLocation}
              </span>
            </div>
          </div>
        </div>

        {/* ─── QUICK METRICS BAR ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/40 border-b border-border text-xs">
          <div className="p-2 rounded-xl bg-card border border-border flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Capacity</p>
              <p className="font-extrabold text-foreground truncate">{eventRegistered} / {eventCapacity} Registered</p>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-card border border-border flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Admission</p>
              <p className="font-extrabold text-emerald-600 truncate">{eventFee === 0 ? "Free Admission" : `₹${eventFee} Entry`}</p>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-card border border-border flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Rituals &amp; Sevas</p>
              <p className="font-extrabold text-foreground truncate">{subPoojas.length} Live Pooja Slots</p>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-card border border-border flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase">Feast / Meals</p>
              <p className="font-extrabold text-foreground truncate">{subMeals.length > 0 ? `${subMeals.length} Meal Batches` : "Prasadam Included"}</p>
            </div>
          </div>
        </div>

        {/* ─── TAB NAVIGATION BAR ─── */}
        <div className="flex items-center gap-1.5 px-4 pt-3 border-b border-border overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "overview"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Info className="w-3.5 h-3.5" /> Overview &amp; Details
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("poojas")}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "poojas"
                ? "border-amber-600 text-amber-600 bg-amber-500/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" /> Pooja Sevas ({subPoojas.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("meals")}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "meals"
                ? "border-orange-600 text-orange-600 bg-orange-500/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-orange-600" /> Lunch &amp; Dinner ({subMeals.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cultural")}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "cultural"
                ? "border-purple-600 text-purple-600 bg-purple-500/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Music className="w-3.5 h-3.5 text-purple-600" /> Cultural &amp; Competitions ({subCulturals.length + subComps.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("volunteers")}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "volunteers"
                ? "border-emerald-600 text-emerald-600 bg-emerald-500/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Duty &amp; Operations
          </button>

          {sponsors.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("sponsors")}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "sponsors"
                  ? "border-amber-600 text-amber-600 bg-amber-500/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500" /> Sponsors ({sponsors.length})
            </button>
          )}
        </div>

        {/* ─── TAB BODY CONTENT ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* 1. OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Event Description & Significance */}
              <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" /> About this Festival &amp; Significance
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {eventDescription}
                </p>
              </div>

              {/* Event Venue & Mandap Logistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-500" /> Venue &amp; Mandap Setup
                  </h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong className="text-foreground">Location:</strong> {eventLocation}</p>
                    <p><strong className="text-foreground">Main Stage:</strong> Central Temple Pavilion / Mandap Gate 1</p>
                    <p><strong className="text-foreground">Dining Area:</strong> Annadanam Hall, Ground Floor (Gate 2)</p>
                    <p><strong className="text-foreground">Parking:</strong> Designated Visitor Parking Lot B &amp; C</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-500" /> Organizing Committee &amp; Help Desk
                  </h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong className="text-foreground">Lead Coordinator:</strong> {organizerName}</p>
                    <p><strong className="text-foreground">Helpline / WhatsApp:</strong> {organizerContact}</p>
                    <p><strong className="text-foreground">Emergency Desk:</strong> Control Room at Main Gate</p>
                    <p><strong className="text-foreground">Medical / First Aid:</strong> Clubhouse Room 102</p>
                  </div>
                </div>
              </div>

              {/* Guidelines & Devotee Instructions */}
              <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 space-y-2">
                <h4 className="text-xs font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-600" /> Devotee Guidelines &amp; Gate Entry Rules
                </h4>
                <ul className="text-xs text-amber-900/80 dark:text-amber-300/80 space-y-1 list-disc list-inside">
                  <li>Please carry your digital QR entry pass on your mobile or printed pass for scanning at Gate 1.</li>
                  <li>Traditional Indian festive attire is recommended for Pooja Sevas and Sankalpam in the Mandap.</li>
                  <li>Prasadam tokens are issued along with your entry pass; scan at the dining counter for lunch/dinner.</li>
                  <li>Senior citizens and families with toddlers can use Priority Gate B for expedited admission.</li>
                </ul>
              </div>
            </div>
          )}

          {/* 2. POOJA SEVAS TAB */}
          {activeTab === "poojas" && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Sacred Pooja Sevas &amp; Sankalpam Slots</h3>
                  <p className="text-xs text-muted-foreground">Book individualized Sankalpam slots with family names &amp; gotram</p>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200">
                  {subPoojas.length} Rituals Available
                </span>
              </div>

              {subPoojas.length === 0 ? (
                <div className="p-8 text-center bg-card border border-border rounded-2xl space-y-2 text-muted-foreground">
                  <Flame className="w-8 h-8 text-amber-500/40 mx-auto" />
                  <p className="font-bold text-foreground">General Pooja &amp; Aarti for all Attendees</p>
                  <p className="text-xs">No individualized slot bookings required. All devotees can attend morning and evening Aartis freely.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subPoojas.map((pooja) => (
                    <div
                      key={pooja.id}
                      className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-3 flex flex-col justify-between hover:border-amber-500/40 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-foreground text-sm">{pooja.title}</h4>
                          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
                            {pooja.fee === 0 ? "Free Seva" : `₹${pooja.fee}`}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                          <p className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-600" /> {pooja.time}</p>
                          <p className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 text-amber-600" /> {pooja.venue}</p>
                        </div>

                        {pooja.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{pooja.description}</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-emerald-600">
                          {pooja.availableSeats} Slots Left
                        </span>
                        <button
                          type="button"
                          onClick={() => handleBooking(pooja)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm cursor-pointer active:scale-95 transition-all"
                        >
                          <Flame className="w-3.5 h-3.5" /> Book Seva Slot
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. MEALS & ANNADANAM TAB */}
          {activeTab === "meals" && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Community Mahaprasadam &amp; Dining Schedule</h3>
                  <p className="text-xs text-muted-foreground">Satvik food courses, prasad tokens &amp; dining batches</p>
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-xl border border-orange-200">
                  {subMeals.length > 0 ? `${subMeals.length} Meal Batches` : "Open Prasadam"}
                </span>
              </div>

              {subMeals.length === 0 ? (
                <div className="p-8 text-center bg-card border border-border rounded-2xl space-y-2 text-muted-foreground">
                  <Utensils className="w-8 h-8 text-orange-500/40 mx-auto" />
                  <p className="font-bold text-foreground">Daily Community Feast is Free for All Devotees</p>
                  <p className="text-xs">Maha Prasadam Lunch is served daily between 12:30 PM and 03:00 PM at the Main Dining Hall.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-3 flex flex-col justify-between hover:border-orange-500/40 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-foreground text-sm">{meal.title}</h4>
                          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20 shrink-0">
                            {meal.fee === 0 ? "Free Feast" : `₹${meal.fee}`}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                          <p className="flex items-center gap-1"><Clock className="w-3 h-3 text-orange-600" /> {meal.time}</p>
                          <p className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 text-orange-600" /> {meal.venue}</p>
                        </div>

                        {meal.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{meal.description}</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Capacity: {meal.availableSeats} Plates
                        </span>
                        <button
                          type="button"
                          onClick={() => handleBooking(meal)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm cursor-pointer active:scale-95 transition-all"
                        >
                          <Utensils className="w-3.5 h-3.5" /> Reserve Food Token
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. CULTURAL & COMPETITIONS TAB */}
          {activeTab === "cultural" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Cultural Stage Shows */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-purple-600" /> Cultural Stage Shows &amp; Performances
                </h4>
                {subCulturals.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 rounded-xl bg-card border border-border">
                    Daily evening musical concerts, devotional bhajans and drama performances at the Main Stage.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {subCulturals.map((cult) => (
                      <div key={cult.id} className="p-3.5 rounded-2xl bg-card border border-border space-y-2">
                        <h5 className="font-bold text-foreground text-xs">{cult.title}</h5>
                        <p className="text-[11px] text-muted-foreground">{cult.time} • {cult.venue}</p>
                        <p className="text-[11px] text-muted-foreground">{cult.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Competitions & Sports */}
              <div className="space-y-2.5 pt-2 border-t border-border">
                <h4 className="text-xs font-extrabold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-cyan-600" /> Community Competitions &amp; Contests
                </h4>
                {subComps.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 rounded-xl bg-card border border-border">
                    Rangoli contest, Sloka chanting, Drawing &amp; Quiz competitions scheduled during the festival.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {subComps.map((comp) => (
                      <div key={comp.id} className="p-3.5 rounded-2xl bg-card border border-border space-y-2 flex flex-col justify-between">
                        <div>
                          <h5 className="font-bold text-foreground text-xs">{comp.title}</h5>
                          <p className="text-[11px] text-muted-foreground">{comp.time} • {comp.venue}</p>
                          <p className="text-[11px] text-muted-foreground">{comp.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBooking(comp)}
                          className="w-full py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-xs cursor-pointer"
                        >
                          Join Competition
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. VOLUNTEERS & OPERATIONS TAB */}
          {activeTab === "volunteers" && (
            <div className="space-y-3 animate-fadeIn text-xs">
              <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                <h4 className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Volunteer Duties &amp; Department Wings
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  The festival operations are coordinated across 6 dedicated volunteer wings. Registered volunteers receive special access badges, meal tokens and certificate of seva appreciation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
                  <p className="font-bold text-foreground flex items-center gap-1">🛡️ Gate Security &amp; Passes</p>
                  <p className="text-[11px] text-muted-foreground">Digital QR scanner gates, devotee badge verification, queue management.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
                  <p className="font-bold text-foreground flex items-center gap-1">🍲 Prasadam &amp; Dining Team</p>
                  <p className="text-[11px] text-muted-foreground">Meal counter serving, drinking water stations, prasad distribution.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
                  <p className="font-bold text-foreground flex items-center gap-1">🪔 Mandap &amp; Pooja Seva Team</p>
                  <p className="text-[11px] text-muted-foreground">Sankalpam arrangements, flower garland seva, priest support.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
                  <p className="font-bold text-foreground flex items-center gap-1">🎭 Stage &amp; Audio Coordination</p>
                  <p className="text-[11px] text-muted-foreground">Sound system, lights, artist hospitality, crowd coordination.</p>
                </div>
              </div>
            </div>
          )}

          {/* 6. SPONSORS & DONORS TAB */}
          {activeTab === "sponsors" && (
            <div className="space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sponsors.map((sp: any) => (
                  <div key={sp.id} className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        {sp.tier || "Sponsor"}
                      </span>
                      <h5 className="font-bold text-foreground text-xs mt-1">{sp.name || sp.companyName}</h5>
                    </div>
                    {sp.amount && (
                      <span className="font-mono font-bold text-xs text-primary">₹{Number(sp.amount).toLocaleString()}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── FOOTER ACTIONS ─── */}
        <div className="p-3.5 bg-muted/30 border-t border-border flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {onBookActivity && (
              <button
                type="button"
                onClick={() => handleBooking(event)}
                className="px-4 py-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-primary-foreground font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer active:scale-95 transition-all"
              >
                <Ticket className="w-3.5 h-3.5" /> Book / Register for Event
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
