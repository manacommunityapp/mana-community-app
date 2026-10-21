import React, { useState, useEffect } from "react";
import {
  X,
  Trophy,
  Calendar,
  MapPin,
  Users,
  Award,
  Shield,
  CheckCircle2,
  ChevronRight,
  Phone,
  Mail,
  FileText,
  Info,
  Clock,
  Sparkles,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useNavigate } from "react-router";
import type { DashboardTournamentCard, DashboardEventCard } from "../../../services/sports/sportsDashboardService";
import type { SportsTournament, SportsEvent, Sponsor } from "../../../types/api";
import { sportsService } from "../../../services/sports/sportsService";
import type { TournamentSponsor } from "./sponsors";

function getSportEmoji(sportName: string | null | undefined): string {
  const n = (sportName || "").toLowerCase();
  if (n.includes("cricket")) return "🏏";
  if (n.includes("football") || n.includes("soccer")) return "⚽";
  if (n.includes("badminton")) return "🏸";
  if (n.includes("volleyball")) return "🏐";
  if (n.includes("basketball")) return "🏀";
  if (n.includes("kabaddi")) return "🤼";
  if (n.includes("hockey")) return "🏑";
  if (n.includes("throwball")) return "🏐";
  if (n.includes("table tennis") || n.includes("tt")) return "🏓";
  if (n.includes("tennis")) return "🎾";
  if (n.includes("chess")) return "♟️";
  if (n.includes("carrom")) return "🎯";
  if (n.includes("pickleball")) return "🏓";
  return "🏆";
}

export interface TournamentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: DashboardTournamentCard | SportsTournament | SportsEvent | null;
  onRegisterEvent?: (eventIdOrUuid: string | number) => void;
  onViewSchedule?: (tournamentId: number) => void;
}

export function TournamentDetailsModal({
  isOpen,
  onClose,
  tournament,
  onViewSchedule,
}: TournamentDetailsModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "groups" | "rules">("overview");
  const [fullDetails, setFullDetails] = useState<SportsTournament | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!isOpen || !tournament?.id) {
      setFullDetails(null);
      return;
    }
    // Fetch full tournament details from /tournaments/{id}
    setLoadingDetails(true);
    sportsService
      .getTournamentById(tournament.id)
      .then((data: any) => setFullDetails(data))
      .catch(() => setFullDetails(null))
      .finally(() => setLoadingDetails(false));
  }, [isOpen, tournament?.id]);

  if (!isOpen || !tournament) return null;

  const t = tournament as any;

  // Real events list: prefer fullDetails sportsEvents if populated, else tournament events
  const events: (DashboardEventCard | SportsEvent | any)[] =
    (fullDetails?.sportsEvents && fullDetails.sportsEvents.length > 0)
      ? fullDetails.sportsEvents
      : (t.events || t.sportsEvents || []);

  const rawStart = fullDetails?.eventDateStart || t.eventDateStart || t.event?.eventDateStart;
  const rawEnd = fullDetails?.eventDateEnd || t.eventDateEnd || t.event?.eventDateEnd;
  const startDate = rawStart ? new Date(rawStart) : null;
  const endDate = rawEnd ? new Date(rawEnd) : null;
  const daysLeft = startDate ? differenceInDays(startDate, new Date()) : null;

  const regStart = fullDetails?.registrationDateStart || t.registrationDateStart;
  const regEnd = fullDetails?.registrationDateEnd || t.registrationDateEnd;

  const status = fullDetails?.registrationStatus || t.registrationStatus || t.status || "OPEN";
  const isOpenRegistration = status === "OPEN" || status === "REGISTRATION_OPEN";
  const isCompleted = status === "COMPLETED" || status === "REGISTRATION_CLOSED";

  const bannerImage = fullDetails?.bannerImage || t.bannerImage || t.event?.bannerImage;
  const communityName = fullDetails?.communityName || t.communityName || (tournament as any).community?.name;

  // Real venue detection: pull from tournament or child event venues
  const detectedVenues = Array.from(
    new Set(
      [
        fullDetails?.venueName,
        fullDetails?.venue?.name,
        t.venueName,
        typeof t.venue === "string" ? t.venue : t.venue?.name,
        ...events.map((e: any) => e.venueName || e.venue?.name),
      ]
        .filter((v): v is string => Boolean(v && typeof v === "string" && v.trim().length > 0))
        .map(v => v.trim())
    )
  );

  const venueDisplay = detectedVenues.length > 0
    ? detectedVenues.join(" · ")
    : (communityName ? `${communityName} Grounds` : "Venue TBA");

  // Real description: only show what was entered by organizers
  const rawDescription = fullDetails?.description || t.description;
  const description = rawDescription && String(rawDescription).trim().length > 0
    ? String(rawDescription).trim()
    : null;

  // Real rules: check if tournament has explicit rules
  const rulesContent = (fullDetails as any)?.rules || t.rules;

  // Real contacts: extract from tournament contacts or organizer fields
  interface ContactInfo {
    name: string;
    title?: string;
    phone?: string;
    email?: string;
  }

  const contactList: ContactInfo[] = [];
  const rawContactsList = fullDetails?.contacts || t.contacts;
  if (Array.isArray(rawContactsList)) {
    rawContactsList.forEach((c: any) => {
      if (c && (c.name || c.number || c.phone || c.email)) {
        contactList.push({
          name: c.name || "Organizer",
          title: c.title || "Organizing Committee",
          phone: c.number || c.phone || "",
          email: c.email || "",
        });
      }
    });
  }

  const directName = fullDetails?.contactName || t.contactName;
  const directPhone = fullDetails?.contactNumber || t.contactNumber;
  const directEmail = fullDetails?.contactEmail || t.contactEmail;
  const directTitle = fullDetails?.contactTitle || t.contactTitle;

  if (directName || directPhone || directEmail) {
    const isDuplicate = contactList.some(
      c => (directName && c.name?.toLowerCase() === directName.toLowerCase()) ||
           (directEmail && c.email?.toLowerCase() === directEmail.toLowerCase())
    );
    if (!isDuplicate) {
      contactList.unshift({
        name: directName || "Tournament Organizer",
        title: directTitle || "Tournament Director",
        phone: directPhone || "",
        email: directEmail || "",
      });
    }
  }

  // Real sponsors: only show actual database sponsors
  const sponsors: (Sponsor | TournamentSponsor)[] =
    (tournament as any).sponsors || fullDetails?.sponsors || [];

  // Group events by real sport name
  const sportsMap = new Map<string, (DashboardEventCard | SportsEvent | any)[]>();
  events.forEach((ev) => {
    const sName = (ev as any).sportName || (ev as any).sport?.name || "Sport";
    if (!sportsMap.has(sName)) sportsMap.set(sName, []);
    sportsMap.get(sName)!.push(ev);
  });
  const sportsList = Array.from(sportsMap.entries());

  // Real tournament formats from tournament and events
  const collectedFormats: string[] = [];
  if (fullDetails?.tournamentType) collectedFormats.push(fullDetails.tournamentType);
  if (t.tournamentType) collectedFormats.push(t.tournamentType);
  if (Array.isArray(fullDetails?.format)) collectedFormats.push(...fullDetails.format);
  if (Array.isArray(t.format)) collectedFormats.push(...t.format);
  events.forEach((e: any) => {
    if (e.tournamentType) collectedFormats.push(e.tournamentType);
    if (Array.isArray(e.format)) collectedFormats.push(...e.format);
    if (Array.isArray(e.formats)) {
      e.formats.forEach((f: any) => f?.format && collectedFormats.push(f.format));
    }
  });

  const formatMap: Record<string, string> = {
    KNOCKOUT: "Knockout",
    LEAGUE: "League",
    ROUND_ROBIN: "Round Robin",
    HYBRID: "League & Knockout",
    GROUPS_KNOCKOUT: "Group + Knockout",
    SINGLE_ELIMINATION: "Single Elimination",
    DOUBLE_ELIMINATION: "Double Elimination",
  };

  const uniqueFormats = Array.from(new Set(collectedFormats.filter(Boolean))).map(
    f => formatMap[f.toUpperCase()] || f
  );

  const tournamentFormatDisplay = uniqueFormats.length > 0 ? uniqueFormats.join(" / ") : "Open Tournament";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Hero Header */}
        <div
          className="relative px-5 py-6 sm:px-8 sm:py-7 text-white overflow-hidden shrink-0"
          style={{
            background: bannerImage
              ? `linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,27,75,0.88)), url(${bannerImage}) center/cover no-repeat`
              : "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer z-10"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <span
              className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isOpenRegistration
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : isCompleted
                  ? "bg-slate-500/20 text-slate-300 border border-slate-400/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
              }`}
            >
              ● {isOpenRegistration ? "Registration Open" : isCompleted ? "Completed" : "In Progress"}
            </span>

            {daysLeft !== null && daysLeft >= 0 && isOpenRegistration && (
              <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {daysLeft === 0 ? "Starts Today!" : `${daysLeft} days to start`}
              </span>
            )}

            {communityName && (
              <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-md bg-white/10 text-indigo-100">
                {communityName}
              </span>
            )}
          </div>

          {/* Tournament Title */}
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner border border-white/20">
              <Trophy className="h-6 w-6 text-amber-300" />
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight truncate m-0 mb-0">
                {tournament.name}
              </h3>
              <div className="flex items-center gap-3 sm:gap-4 mt-1.5 text-xs text-indigo-200 flex-wrap">
                {startDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                    {format(startDate, "MMM d, yyyy")}
                    {endDate && ` - ${format(endDate, "MMM d, yyyy")}`}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="truncate max-w-[220px]" title={venueDisplay}>{venueDisplay}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-300" />
                  {events.length} {events.length === 1 ? "Event" : "Events / Categories"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-200 bg-slate-50/70 shrink-0">
          {[
            { key: "overview", label: "Overview & Details", icon: Info },
            {
              key: "groups",
              label: `Sports Groups (${events.length})`,
              icon: Users,
            },
            { key: "rules", label: "Rules & Guidelines", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  active
                    ? "border-indigo-600 text-indigo-600 bg-white rounded-t-lg shadow-2xs"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-lg"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Highlights 4-card Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider">Tournament Format</span>
                  <div className="text-sm font-bold text-slate-800 mt-1 truncate" title={tournamentFormatDisplay}>
                    {tournamentFormatDisplay}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">Venue & Courts</span>
                  <div className="text-sm font-bold text-slate-800 mt-1 truncate" title={venueDisplay}>
                    {venueDisplay}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Categories</span>
                  <div className="text-sm font-bold text-slate-800 mt-1">
                    {events.length} {isOpenRegistration ? "Groups Open" : "Total Groups"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase text-violet-700 tracking-wider">Total Sports</span>
                  <div className="text-sm font-bold text-slate-800 mt-1">
                    {sportsList.length} Sports
                  </div>
                </div>
              </div>

              {/* Tournament Schedule Window / Timings (if present in database) */}
              {(regStart || regEnd || fullDetails?.startTime || fullDetails?.dueTime) && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  {(regStart || regEnd) && (
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold text-slate-800">Registration Window:</span>
                      <span>
                        {regStart ? format(new Date(regStart), "MMM d, yyyy") : "Open"}
                        {regEnd && ` to ${format(new Date(regEnd), "MMM d, yyyy")}`}
                      </span>
                    </div>
                  )}
                  {(fullDetails?.startTime || fullDetails?.dueTime) && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold text-slate-800">Match Timings:</span>
                      <span>
                        {fullDetails.startTime || "TBD"}
                        {fullDetails.dueTime && ` - ${fullDetails.dueTime}`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* About Tournament */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">About Tournament</h4>
                {description ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {description}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-500 italic">
                    No tournament description has been provided by the organizers.
                  </div>
                )}
              </div>

              {/* Included Sports Preview */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Sports & Categories Included
                </h4>
                {sportsList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                    No sports currently configured for this tournament.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {sportsList.map(([sport, evList]) => (
                      <div
                        key={sport}
                        className="p-3 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-200 hover:shadow-xs transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{getSportEmoji(sport)}</span>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{sport}</div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {evList.length} {evList.length === 1 ? "group/category" : "groups/categories"}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("groups")}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                        >
                          View Groups <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Official Tournament Partners (Only if real database sponsors exist) */}
              {sponsors.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Official Tournament Partners
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {sponsors.map((sp, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{sp.name}</span>
                        {(sp as any).category && (
                          <span className="text-[10px] text-amber-700/80 font-normal">
                            ({(sp as any).category})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Organizing Committee & Contacts */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Organizing Committee & Contacts
                </h4>
                {contactList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {contactList.map((c, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {c.name ? c.name.charAt(0).toUpperCase() : "O"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{c.name}</div>
                          {c.title && (
                            <div className="text-[10px] text-indigo-600 font-medium truncate">{c.title}</div>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600 flex-wrap">
                            {c.phone && (
                              <a
                                href={`tel:${c.phone}`}
                                className="inline-flex items-center gap-1 hover:text-indigo-600"
                              >
                                <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                              </a>
                            )}
                            {c.email && (
                              <a
                                href={`mailto:${c.email}`}
                                className="inline-flex items-center gap-1 hover:text-indigo-600 truncate"
                              >
                                <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Direct organizer contact details have not been listed for this tournament. Please reach out to your community sports committee for assistance.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "groups" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Sports Groups & Categories</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Overview of sports categories, venues, and participant capacity for this tournament.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {events.length} Groups
                </span>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                  <Trophy className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                  <p className="text-sm font-medium">No events currently mapped for this tournament</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {events.map((item: any) => {
                    const sportName = item.sportName || item.sport?.name || "Sport";
                    const emoji = getSportEmoji(sportName);
                    const isEventOpen = item.registrationStatus === "REGISTRATION_OPEN" || isOpenRegistration;
                    const registeredCount = item.registeredCount ?? item.registrationCount ?? 0;
                    const maxParticipants = item.maxParticipants;
                    const venueItem = item.venueName || item.venue?.name;
                    const formatBadge = item.teamSport
                      ? "Team Event"
                      : (item.categoryName || "").toLowerCase().includes("double")
                      ? "Doubles"
                      : "Singles";

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3 text-left"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-2xl p-1.5 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                                {emoji}
                              </span>
                              <div className="min-w-0">
                                <h5 className="text-sm font-bold text-slate-900 truncate">
                                  {item.categoryName || item.name}
                                </h5>
                                <div className="text-[11px] text-slate-500 font-medium truncate">
                                  {sportName} {venueItem ? `· ${venueItem}` : ""}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                                formatBadge === "Team Event"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : formatBadge === "Doubles"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {formatBadge}
                            </span>
                          </div>

                          {/* Capacity meter */}
                          <div className="mt-3">
                            <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-1">
                              <span>Spots Filled</span>
                              <span className="font-semibold text-slate-700">
                                {registeredCount}
                                {maxParticipants ? ` / ${maxParticipants}` : " (Unlimited)"}
                              </span>
                            </div>
                            {maxParticipants ? (
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(100, Math.round((registeredCount / maxParticipants) * 100))}%`,
                                  }}
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Status & Schedule Info (NO registration button in info modal) */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                              isEventOpen
                                ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                                : "text-slate-600 bg-slate-100 border border-slate-200"
                            }`}
                          >
                            {isEventOpen && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            <span>{isEventOpen ? "Registration Open" : "Closed"}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              if (onViewSchedule) {
                                onViewSchedule(tournament.id);
                              } else {
                                navigate(`/sports/schedule/${tournament.id}`);
                              }
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer transition-colors"
                          >
                            <span>Schedule</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "rules" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-indigo-900 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Official tournament guidelines and participation regulations.
                </span>
              </div>

              {rulesContent ? (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                  {rulesContent}
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 font-medium">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>General Tournament Guidelines</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs sm:text-sm">
                    <li>All participants must adhere to the community sportsmanship code and fair play principles.</li>
                    <li>Players should report to the designated venue 15 minutes prior to their fixture start time.</li>
                    <li>Appropriate athletic sportswear and court-specific footwear (non-marking shoes for indoor sports) are required.</li>
                    <li>Match schedules, court assignments, and bracket progressions are available under the Match Schedule page.</li>
                    <li>In case of disputes, decisions rendered by tournament referees and the sports organizing committee are final.</li>
                  </ul>
                  {description && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Organizer Notes & Instructions
                      </div>
                      <p className="text-xs text-slate-600 whitespace-pre-line font-normal">{description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer (Pure Info Modal: NO register button) */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onViewSchedule) {
                onViewSchedule(tournament.id);
              } else {
                navigate(`/sports/schedule/${tournament.id}`);
              }
            }}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200/70 transition-all border border-slate-200 cursor-pointer flex items-center gap-1.5"
          >
            <span>View Match Schedule</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200/70 bg-white border border-slate-200 shadow-2xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
