import { useState, useEffect, useCallback, useRef } from "react";
import { safeStorage } from "../../../../utils/storage";
import { Loader2, CalendarIcon, MapPin, Plus, LayoutDashboard, Edit2, Trash2, EyeOff, Eye, Users, Clock, X, Search, Trophy, ChevronDown, Check, Settings, ShieldCheck, AlertCircle, Target, Activity } from "lucide-react";
import { TIME_OPTIONS } from "../../../../constants/timeOptions";
import { Link } from "react-router";
import { format } from "date-fns";
import { showSuccess, showWarning, showError, showInfo } from "../../../../utils/ToastUtils";
import { confirmAction } from "../../../../utils/AlertUtils";

const toast = {
  success: (msg: string) => showSuccess(msg),
  warning: (msg: string) => showWarning(msg),
  error: (msg: string) => showError(msg),
  info: (msg: string) => showInfo(msg),
};
import { sportsService } from "../../../../services/sportsService";
import { venueService } from "../../../../services/venueService";
import { communityService } from "../../../../services/communityService";
import { auctionService } from "../../../../services/auctionService";
import { userService } from "../../../../services/userService";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  CREATE_EDIT_SPORTS_MAIN,
  CREATE_EDIT_PLAYER_POOL,
  CREATE_EDIT_EVENT_REGISTRATIONS,
  DELETE_SPORTS_MAIN,
} from "../../../../constants/permissions";
import { AdminSportsMeta } from "../../admin/AdminSportsMeta";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar } from "../../ui/calendar";
import { Button } from "../../ui/button";
import { cn } from "../../ui/utils";
import type { Venue, SportMeta, PlayerCategory, CommunityResponse, TournamentRegistration, AuctionTeam, Court, EventRegistration, MatchFormat, SportsEventRequest, SportFormEvent, SportFormEntry, EventContact } from "../../../../types/api";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { SportEventConfigModal } from "./SportEventConfigModal";
import { VenueDetailsModal } from "./VenueDetailsModal";
import { ContactNameAutocomplete } from "./ContactNameAutocomplete";
import { VenueCreationSection } from "./VenueCreationSection";
import { PlayerCategorySection } from "./PlayerCategorySection";
import { SportsMetaSection } from "./SportsMetaSection";
import { RegistrationOpenModal } from "./RegistrationOpenModal";
import type { RegistrationNotifConfig } from "./RegistrationOpenModal";
import { notificationService } from "../../../../services/notificationService";
import { DashboardTab } from "./DashboardTab";
import { TeamsTab } from "./TeamsTab";
import { ScheduleTab, ResultsTab, SettingsTab } from "./PlaceholderTabs";
import { CreateTournamentTab } from "./CreateTournamentTab";
import { SportsEventTab } from "./SportsEventTab";
import { NotificationSetupModal } from "./NotificationSetupModal";
import { AddPlayerModal } from "./AddPlayerModal";
import { ImportPlayersModal } from "./ImportPlayersModal";
import "../SportsAuction.css";

const DEFAULT_TRIGGERS = {
  "7d":  { id: "7d",  label: "7 Days Before",       offset: -7 * 24 * 60, color: "border-blue-500",   bgColor: "rgba(59,130,246,0.15)",   textColor: "text-blue-400",   emoji: "📅", tagClass: "bg-blue-500/15 text-blue-400 border border-blue-500/20", category: "Registration", priority: "Critical" },
  "1d":  { id: "1d",  label: "1 Day Before",         offset: -1 * 24 * 60, color: "border-amber-500",  bgColor: "rgba(245,158,11,0.15)",   textColor: "text-amber-400",  emoji: "🌅", tagClass: "bg-amber-500/15 text-amber-400 border border-amber-500/20", category: "Reminder",   priority: "Critical" },
  "2h":  { id: "2h",  label: "2 Hours Before",       offset: -120,         color: "border-emerald-500",bgColor: "rgba(16,185,129,0.15)",  textColor: "text-emerald-400", emoji: "⚡", tagClass: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", category: "Urgent",   priority: "High" },
  "30m": { id: "30m", label: "30 Minutes Before",    offset: -30,          color: "border-rose-500",   bgColor: "rgba(244,63,94,0.15)",   textColor: "text-rose-400",   emoji: "🔴", tagClass: "bg-rose-500/15 text-rose-400 border border-rose-500/20", category: "Critical",   priority: "Critical" },
  "now": { id: "now", label: "At Tournament Start",  offset: 0,            color: "border-yellow-400", bgColor: "rgba(245,158,11,0.2)",    textColor: "text-yellow-400",  emoji: "🏁", tagClass: "bg-amber-500/15 text-amber-500 border border-amber-500/20", category: "Live",       priority: "Normal" }
} as const;

const CHANNEL_META = [
  { id: "push",     emoji: "📲", label: "Push" },
  { id: "email",    emoji: "✉️", label: "Email" },
  { id: "sms",      emoji: "💬", label: "SMS" },
  { id: "whatsapp", emoji: "🟢", label: "WhatsApp" },
  { id: "inapp",    emoji: "🔔", label: "In-App" }
] as const;

const CUSTOM_OFFSET_OPTIONS = [
  { offset: -15, label: "15 minutes before" },
  { offset: -45, label: "45 minutes before" },
  { offset: -180, label: "3 hours before" },
  { offset: -360, label: "6 hours before" },
  { offset: -2880, label: "2 days before" },
  { offset: -4320, label: "3 days before" },
  { offset: 30, label: "After match ends" }
] as const;

const RECIPIENT_OPTIONS = [
  "Registered Players",
  "Team Owners",
  "All Members",
  "Admins Only",
  "Spectators",
  "Referees"
] as const;

type TabId = "sports-event" | "teams" | "schedule" | "create-venue" | "player-category" | "results" | "settings" | "sports-meta" | "create-tournament" | "dashboard";

interface SportEventState {
  id: string;
  name: string;
  gender: string;
  playersBorn: string;
  format?: string;
  minPlayers?: number;
  maxPlayers?: number;
  tournamentType?: string;
  minAge?: number;
  maxAge?: number;
  eventId?: number;
}


interface SelectedSportWithEvents {
  sportId: number;
  sportName: string;
  sportIcon?: string;
  sportIconUrl?: string;
  events: SportEventState[];
}

const isTeamSport = (sportName: string): boolean => {
  const name = sportName.toLowerCase();
  return (
    name.includes("cricket") ||
    name.includes("football") ||
    name.includes("volleyball") ||
    name.includes("basketball") ||
    name.includes("kabaddi") ||
    name.includes("hockey") ||
    name.includes("soccer") ||
    name.includes("throwball") ||
    name.includes("rugby")
  );
};

const PREDEFINED_SPORTS: { name: string; icon: string }[] = [
  { name: "Badminton", icon: "🏸" },
  { name: "Basketball", icon: "🏀" },
  { name: "Beach Volleyball", icon: "🏐" },
  { name: "Billiards", icon: "🎱" },
  { name: "Bowling", icon: "🎳" },
  { name: "Carrom", icon: "🎯" },
  { name: "Chess", icon: "♟️" },
  { name: "Cricket (Tennis Ball)", icon: "🏏" },
  { name: "Cycling", icon: "🚴" },
  { name: "Dart", icon: "🎯" },
  { name: "Foosball", icon: "⚽" },
  { name: "Grass Volleyball", icon: "🏐" },
  { name: "Kabaddi", icon: "🤼" },
  { name: "Pickleball", icon: "🏓" },
  { name: "Pool", icon: "🎱" },
  { name: "Running (100M)", icon: "🏃" },
  { name: "Running (1500M)", icon: "🏃" },
  { name: "Running (200M)", icon: "🏃" },
  { name: "Running (400M)", icon: "🏃" },
  { name: "Running (800M)", icon: "🏃" },
  { name: "Running (Others)", icon: "🏃" },
  { name: "Snooker", icon: "🎱" },
  { name: "Soccer", icon: "⚽" },
  { name: "Squash", icon: "🎾" },
  { name: "Swimming Race", icon: "🏊" },
  { name: "Table Tennis", icon: "🏓" },
  { name: "Tennis", icon: "🎾" },
  { name: "Throwball", icon: "🤾" },
  { name: "Tug of War", icon: "🪢" },
  { name: "Volleyball", icon: "🏐" },
];

const getDefaultMinPlayers = (sportName: string): number => {
  const name = sportName.toLowerCase();
  if (name.includes("cricket")) return 11;
  if (name.includes("football")) return 11;
  if (name.includes("basketball")) return 5;
  if (name.includes("volleyball")) return 6;
  if (name.includes("kabaddi")) return 7;
  return 5;
};

const initialTeams = [
  { id: 1, name: "City Hoopers", sport: "Basketball", division: "Competitive", captain: "Arjun Mehta", members: 12, status: "active", record: "8-3" },
  { id: 2, name: "Downtown Dunkers", sport: "Basketball", division: "Competitive", captain: "Ravi Kumar", members: 10, status: "active", record: "6-5" },
  { id: 3, name: "United FC", sport: "Soccer", division: "Recreational", captain: "Suresh Nair", members: 11, status: "active", record: "5-4-1" },
  { id: 4, name: "Galacticos", sport: "Soccer", division: "Recreational", captain: "Deepak Joshi", members: 11, status: "active", record: "5-5" },
  { id: 5, name: "Spike Syndicate", sport: "Volleyball", division: "Competitive", captain: "Priya Singh", members: 9, status: "pending", record: "0-0" },
  { id: 6, name: "Net Ninjas", sport: "Volleyball", division: "Recreational", captain: "Anita Sharma", members: 7, status: "pending", record: "0-0" },
];

const initialPendingRegistrations = [
  { id: 1, teamName: "Thunder Hawks", sport: "Basketball", captain: "Manoj Pillai", email: "manoj@email.com", members: 8, date: "Jun 10" },
  { id: 2, teamName: "Green Warriors", sport: "Soccer", captain: "Sandeep Rao", email: "sandeep@email.com", members: 9, date: "Jun 11" },
];

const BasketballIcon = ({ size = 24, className, ...props }: React.ComponentPropsWithoutRef<"svg"> & { size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v20" />
    <path d="M2 12h20" />
    <path d="M4.93 4.93a10 10 0 0 1 0 14.14" />
    <path d="M19.07 4.93a10 10 0 0 0 0 14.14" />
  </svg>
);

const sportIconMap: Record<string, React.ElementType> = {
  Basketball: BasketballIcon,
  Soccer: Target,
  Volleyball: Activity,
};

const sportColorMap: Record<string, string> = {
  Basketball: "#f59e0b",
  Soccer: "#10b981",
  Volleyball: "#6366f1",
};

export function SportsAdmin() {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const isAdmin = hasAnyPermission(CREATE_EDIT_SPORTS_MAIN, CREATE_EDIT_PLAYER_POOL, CREATE_EDIT_EVENT_REGISTRATIONS, DELETE_SPORTS_MAIN);
  const [sportsMeta, setSportsMeta] = useState<SportMeta[]>([]);
  const [playerCategories, setPlayerCategories] = useState<PlayerCategory[]>([]);
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);

  // Category Template Search States
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, string>>({});
  const [openDropdownEventId, setOpenDropdownEventId] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  const [selectedSports, setSelectedSports] = useState<number[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const [selectedSportsWithEvents, setSelectedSportsWithEvents] = useState<SelectedSportWithEvents[]>([]);
  const [selectedCats, setSelectedCats] = useState<number[]>([]);
  const [selectedCommId, setSelectedCommId] = useState<number | "">("");

  const [eventName, setEventName] = useState("");
  const [maxPax, setMaxPax] = useState("64");

  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | "">("");
  const [selectedVenueDetails, setSelectedVenueDetails] = useState<Venue | null>(null);
  const [loadingVenueDetails, setLoadingVenueDetails] = useState(false);
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [activeTournaments, setActiveTournaments] = useState<any[]>([]);
  const [activatingTournament, setActivatingTournament] = useState<{ id: number; name: string } | null>(null);

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [regStartDate, setRegStartDate] = useState<Date>();
  const [regEndDate, setRegEndDate] = useState<Date>();

  // --- New Event Fields states ---
  const [eventContactName, setEventContactName] = useState("");
  const [eventContactNumber, setEventContactNumber] = useState("");
  const [eventContactEmail, setEventContactEmail] = useState("");
  const [otherContacts, setOtherContacts] = useState<{ title: string; name: string; detail: string; }[]>([]);
  const [sponsors, setSponsors] = useState<{ category: string; name: string; url: string; }[]>([]);
  const [bannerImage, setBannerImage] = useState("");
  const [tournamentLevel, setTournamentLevel] = useState<"Standard" | "Professional" | "Premium">("Standard");
  const [description, setDescription] = useState("");
  const [allowAdminChat, setAllowAdminChat] = useState(false);
  const [startTime, setStartTime] = useState("09:00 AM");
  const [dueTime, setDueTime] = useState("06:00 PM");

  const [globalChannels, setGlobalChannels] = useState<string[]>(["push", "email"]);
  const [previewTrigger, setPreviewTrigger] = useState<string>("2h");
  const [expandedTrigger, setExpandedTrigger] = useState<string | null>(null);
  const [customTriggers, setCustomTriggers] = useState<any[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSportConfigModal, setShowSportConfigModal] = useState(false);
  const [configuringSportId, setConfiguringSportId] = useState<number | null>(null);
  const [showVenueDetailsModal, setShowVenueDetailsModal] = useState(false);

  const [triggerStates, setTriggerStates] = useState<Record<string, {
    enabled: boolean;
    title: string;
    body: string;
    recipients: string[];
    overrideChannels: string[];
  }>>({
    "7d": {
      enabled: true,
      title: "🏏 Tournament Registration Open!",
      body: "Registration is now open for {{tournament_name}}! 🏆 Starting {{start_date}} at {{venue}}. Register before spots fill up. Tap to register now.",
      recipients: ["All Members", "Community Feed"],
      overrideChannels: ["push", "email", "whatsapp"]
    },
    "1d": {
      enabled: true,
      title: "🏆 Tournament Tomorrow!",
      body: "{{tournament_name}} begins TOMORROW at {{start_time}}! 📍 {{venue}}. Your match schedule is ready. Check your fixtures and prepare. See you on the ground! 🏅",
      recipients: ["Registered Players", "Team Owners", "Admins Only"],
      overrideChannels: []
    },
    "2h": {
      enabled: true,
      title: "⚡ 2 Hours to Kick-Off!",
      body: "⚡ {{tournament_name}} starts in 2 hours! Report at {{venue}} by {{report_time}}. Bring your kit & ID. Your first match is ready! Let's go! 🏏",
      recipients: ["Registered Players", "Team Owners", "Referees"],
      overrideChannels: []
    },
    "30m": {
      enabled: true,
      title: "🔴 30 Mins to Start — Head to Ground!",
      body: "🔴 FINAL CALL — {{tournament_name}} begins in 30 minutes! Head to {{venue}} NOW. Gate A open. Toss in 15 mins. Don't be late — matches won't be delayed! ⏱️",
      recipients: ["Registered Players", "Referees"],
      overrideChannels: ["push", "sms", "whatsapp", "inapp"]
    },
    "now": {
      enabled: true,
      title: "🏁 Tournament is LIVE Now!",
      body: "🏁 {{tournament_name}} has officially started! Follow live scores, results, and standings right here in the app. Play hard! 🏆",
      recipients: ["All Members", "Spectators", "Community Feed"],
      overrideChannels: []
    }
  });

  const getTournamentStartDateTime = useCallback(() => {
    if (!startDate) return null;
    const baseDate = new Date(startDate);
    
    let hours = 9;
    let minutes = 0;
    
    if (startTime) {
      const match = startTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const ampm = match[3];
        if (ampm) {
          if (ampm.toUpperCase() === "PM" && hours < 12) {
            hours += 12;
          } else if (ampm.toUpperCase() === "AM" && hours === 12) {
            hours = 0;
          }
        }
      }
    }
    
    baseDate.setHours(hours, minutes, 0, 0);
    return baseDate;
  }, [startDate, startTime]);

  const formatINRDate = useCallback((dateTimeStr: Date | string | null | undefined, offsetMinutes: number) => {
    if (!dateTimeStr) return "—";
    const baseDate = new Date(dateTimeStr);
    const calculatedDate = new Date(baseDate.getTime() + offsetMinutes * 60000);
    
    return calculatedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
      " · " + calculatedDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }, []);

  const toggleGlobalChannel = (channelId: string) => {
    setGlobalChannels(prev => 
      prev.includes(channelId) ? prev.filter(c => c !== channelId) : [...prev, channelId]
    );
  };

  const toggleTriggerRow = (id: string, isCustom?: boolean) => {
    if (isCustom) {
      setCustomTriggers(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
    } else {
      setTriggerStates(prev => ({
        ...prev,
        [id]: { ...prev[id], enabled: !prev[id].enabled }
      }));
    }
  };

  const handleTriggerFieldChange = (id: string, isCustom: boolean, field: string, value: any) => {
    if (isCustom) {
      setCustomTriggers(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    } else {
      setTriggerStates(prev => ({
        ...prev,
        [id]: { ...prev[id], [field]: value }
      }));
    }
  };

  const toggleRecipient = (id: string, isCustom: boolean, recipient: string) => {
    if (isCustom) {
      setCustomTriggers(prev => prev.map(t => {
        if (t.id === id) {
          const current = t.recipients;
          const updated = current.includes(recipient) 
            ? current.filter((r: string) => r !== recipient) 
            : [...current, recipient];
          return { ...t, recipients: updated };
        }
        return t;
      }));
    } else {
      setTriggerStates(prev => {
        const current = prev[id].recipients;
        const updated = current.includes(recipient) 
          ? current.filter((r: string) => r !== recipient) 
          : [...current, recipient];
        return { ...prev, [id]: { ...prev[id], recipients: updated } };
      });
    }
  };

  const toggleTriggerChannel = (id: string, channelId: string, isCustom: boolean) => {
    if (isCustom) {
      setCustomTriggers(prev => prev.map(t => {
        if (t.id === id) {
          const current = t.overrideChannels || [];
          const updated = current.includes(channelId)
            ? current.filter((c: string) => c !== channelId)
            : [...current, channelId];
          return { ...t, overrideChannels: updated };
        }
        return t;
      }));
    } else {
      setTriggerStates(prev => {
        const current = prev[id].overrideChannels || [];
        const updated = current.includes(channelId)
          ? current.filter((c: string) => c !== channelId)
          : [...current, channelId];
        return { ...prev, [id]: { ...prev[id], overrideChannels: updated } };
      });
    }
  };

  const addCustomTrigger = () => {
    const newId = `custom_${Date.now()}`;
    const newTrigger = {
      id: newId,
      label: `Custom Trigger ${customTriggers.length + 1}`,
      offset: -15, // Default 15 minutes before
      enabled: true,
      title: "✨ Match Alert Update!",
      body: "Attention: Update regarding {{tournament_name}}! Please check your schedule and details.",
      recipients: ["Registered Players"],
      overrideChannels: ["push"],
      priority: "Normal",
      category: "Custom"
    };
    setCustomTriggers(prev => [...prev, newTrigger]);
    setExpandedTrigger(newId);
    toast.success(`Custom trigger "${newTrigger.label}" added`);
  };

  const removeCustomTrigger = (id: string) => {
    setCustomTriggers(prev => prev.filter(t => t.id !== id));
    if (previewTrigger === id) {
      setPreviewTrigger("2h");
    }
    if (expandedTrigger === id) {
      setExpandedTrigger(null);
    }
    toast.success("Custom trigger removed");
  };

  const getCompiledPreviewBody = useCallback(() => {
    let rawBody = "";
    const defaultTrigger = triggerStates[previewTrigger];
    if (defaultTrigger) {
      rawBody = defaultTrigger.body;
    } else {
      const customTrigger = customTriggers.find(t => t.id === previewTrigger);
      if (customTrigger) rawBody = customTrigger.body;
    }

    const baseDate = getTournamentStartDateTime();
    const displayEventName = eventName.trim() || "Cricket League Season 2026";
    const displayVenue = selectedVenueDetails?.name || "Sector 12 Ground, Block C";
    
    const displayStartDate = regStartDate 
      ? format(regStartDate, "dd MMM yyyy") 
      : "25 Nov 2026";
      
    const displayStartTime = startTime || "09:00 AM";
    
    let displayReportTime = "8:30 AM";
    if (baseDate) {
      const reportDate = new Date(baseDate.getTime() - 30 * 60000);
      displayReportTime = reportDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    
    return rawBody
      .replace(/{{tournament_name}}/g, displayEventName)
      .replace(/{{venue}}/g, displayVenue.split(",")[0])
      .replace(/{{start_date}}/g, displayStartDate)
      .replace(/{{start_time}}/g, displayStartTime)
      .replace(/{{report_time}}/g, displayReportTime);
  }, [triggerStates, customTriggers, previewTrigger, getTournamentStartDateTime, eventName, selectedVenueDetails, startTime, regStartDate]);

  // Compile full array for loop render
  const allTriggersToRender = [
    ...Object.values(DEFAULT_TRIGGERS).map(dt => ({
      ...dt,
      isCustom: false,
      enabled: triggerStates[dt.id].enabled,
      title: triggerStates[dt.id].title,
      body: triggerStates[dt.id].body,
      recipients: triggerStates[dt.id].recipients,
      overrideChannels: triggerStates[dt.id].overrideChannels
    })),
    ...customTriggers.map(ct => ({
      ...ct,
      isCustom: true,
      tagClass: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
      bgColor: "rgba(139,92,246,0.15)",
      textColor: "text-violet-400",
      emoji: "✨"
    }))
  ];

  // Dynamic calculations
  const totalEnabledCount = Object.values(triggerStates).filter(t => t.enabled).length + customTriggers.filter(t => t.enabled).length;

  const totalOutputSends = Object.values(triggerStates).reduce((acc, curr) => acc + (curr.enabled ? (curr.overrideChannels.length || globalChannels.length) : 0), 0) +
    customTriggers.reduce((acc, curr) => acc + (curr.enabled ? (curr.overrideChannels.length || globalChannels.length) : 0), 0);

  const currentActiveChannels = (() => {
    const defaultTrigger = triggerStates[previewTrigger];
    if (defaultTrigger) {
      return defaultTrigger.overrideChannels.length > 0 ? defaultTrigger.overrideChannels : globalChannels;
    } else {
      const customTrigger = customTriggers.find(t => t.id === previewTrigger);
      if (customTrigger) {
        return customTrigger.overrideChannels.length > 0 ? customTrigger.overrideChannels : globalChannels;
      }
    }
    return globalChannels;
  })();

  const getPreviewRecipientsCount = () => {
    let chosenRecipients: string[] = [];
    const defaultTrigger = triggerStates[previewTrigger];
    if (defaultTrigger) {
      chosenRecipients = defaultTrigger.recipients;
    } else {
      const customTrigger = customTriggers.find(t => t.id === previewTrigger);
      if (customTrigger) chosenRecipients = customTrigger.recipients;
    }

    let count = 0;
    if (chosenRecipients.includes("All Members")) count += 180;
    if (chosenRecipients.includes("Registered Players")) count += 43;
    if (chosenRecipients.includes("Team Owners")) count += 8;
    if (chosenRecipients.includes("Referees")) count += 4;
    if (chosenRecipients.includes("Spectators")) count += 60;
    if (chosenRecipients.includes("Community Feed")) count += 10;

    return count === 0 ? 0 : Math.min(230, count);
  };

  const previewCount = getPreviewRecipientsCount();
  const previewPercentage = Math.round((previewCount / 230) * 100) || 10;

  const addOtherContact = () => {
    setOtherContacts(prev => [...prev, { title: "", name: "", detail: "" }]);
  };
  const removeOtherContact = (index: number) => {
    setOtherContacts(prev => prev.filter((_, i) => i !== index));
  };
  const updateOtherContact = (index: number, field: "title" | "name" | "detail", value: string) => {
    setOtherContacts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSponsor = () => {
    setSponsors(prev => [...prev, { category: "", name: "", url: "" }]);
  };
  const removeSponsor = (index: number) => {
    setSponsors(prev => prev.filter((_, i) => i !== index));
  };
  const updateSponsor = (index: number, field: "category" | "name" | "url", value: string) => {
    setSponsors(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image file size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImage(reader.result as string);
        toast.success("Banner image loaded successfully");
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [teamsList, setTeamsList] = useState(initialTeams);
  const [pendingList, setPendingList] = useState(initialPendingRegistrations);
  const [adminSearchQuery, setAdminSearchQuery] = useState("");

  const approveTeam = (id: number) => {
    const reg = pendingList.find(p => p.id === id);
    if (!reg) return;
    const newTeam = {
      id: Date.now(),
      name: reg.teamName,
      sport: reg.sport,
      division: "Competitive",
      captain: reg.captain,
      members: reg.members,
      status: "active" as const,
      record: "0-0"
    };
    setTeamsList(prev => [...prev, newTeam]);
    setPendingList(prev => prev.filter(p => p.id !== id));
    toast.success(`Team "${reg.teamName}" approved successfully!`);
  };
  // Track which tabs have already done their initial data load so we don't
  // re-fetch on every revisit. Mutations explicitly refresh their own data.
  const hydratedTabs = useRef(new Set<TabId>());
  // Fetch-once guards: tournaments/events are shared across multiple tabs;
  // fetch them a single time regardless of which tab triggers the need.
  const tournamentsFetchedRef = useRef(false);
  const eventsFetchedRef = useRef(false);

  // ─── Sports Event form state ───
  const [showSportForm, setShowSportForm] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [sportPickerSearch, setSportPickerSearch] = useState("");
  const [sportForms, setSportForms] = useState<SportFormEntry[]>([]);
  const [sportSubmitting, setSportSubmitting] = useState(false);
  const [customSportName, setCustomSportName] = useState("");
  const [customSportFormat, setCustomSportFormat] = useState<MatchFormat>("SINGLES");
  const [customSportIcon, setCustomSportIcon] = useState("🏆");

  useEffect(() => {
    setCustomSportName(sportPickerSearch);
  }, [sportPickerSearch]);

  // ─── Venue form state ───
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [editingVenueId, setEditingVenueId] = useState<number | null>(null);
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [venueArea, setVenueArea] = useState("");
  const [venueMapLink, setVenueMapLink] = useState("");
  const [venueCapacity, setVenueCapacity] = useState("");
  const [venueOpeningTime, setVenueOpeningTime] = useState("08:00 AM");
  const [venueClosingTime, setVenueClosingTime] = useState("08:00 PM");
  const [venueType, setVenueType] = useState("");
  const [venueCommId, setVenueCommId] = useState<number | "">("")
  const [venueCommunities, setVenueCommunities] = useState<CommunityResponse[]>([]);
  const [venueSubmitting, setVenueSubmitting] = useState(false);
  const [hiddenVenues, setHiddenVenues] = useState<Set<number>>(new Set());

  // ─── Courts & Contact Info states ───
  const [courts, setCourts] = useState<Court[]>([]);
  const [venueContacts, setVenueContacts] = useState<EventContact[]>([{ name: "", title: "", number: "", email: "" }]);
  const [venuePinCode, setVenuePinCode] = useState("");

  const addVenueContact = () => {
    setVenueContacts(prev => [...prev, { name: "", title: "", number: "", email: "" }]);
  };

  const removeVenueContact = (index: number) => {
    setVenueContacts(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };

  const updateVenueContact = (index: number, field: keyof EventContact, value: string) => {
    setVenueContacts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const addCourt = () => {
    setCourts(prev => [...prev, { name: "", color: "#3b82f6" }]);
  };

  const removeCourt = (index: number) => {
    setCourts(prev => prev.filter((_, i) => i !== index));
  };

  const updateCourt = (index: number, field: "name" | "color", value: string) => {
    setCourts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  // ─── Player Category form state ───
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryMinAge, setCategoryMinAge] = useState("");
  const [categoryMaxAge, setCategoryMaxAge] = useState("");
  const [categoryGender, setCategoryGender] = useState("");
  const [categoryCommId, setCategoryCommId] = useState<number | "">("")
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // ─── Registration viewing state ───
  const [viewingEventId, setViewingEventId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"players" | "captains">("players");
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [nominatedCaptains, setNominatedCaptains] = useState<AuctionTeam[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // ─── Manual Add Participant Modal State ───
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [selectedEventIdForAdd, setSelectedEventIdForAdd] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<number>(1);
  const [selectedEventIdForImport, setSelectedEventIdForImport] = useState<number | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [addPlayerForms, setAddPlayerForms] = useState<Array<{
    id: string;
    playerName: string;
    playerEmail: string;
    categoryId: string;
    avatarUrl: string;
    matchType: string;
    age: number;
    flatNumber: string;
    relation: string;
    role: string;
    matches: number;
    runs: number;
    wickets: number;
    strikeRate: number;
    avgScore: number;
  }>>([
    {
      id: Math.random().toString(),
      playerName: "",
      playerEmail: "",
      categoryId: "",
      avatarUrl: "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media",
      matchType: "SINGLES",
      age: 25,
      flatNumber: "",
      relation: "OTHER",
      role: "",
      matches: 0,
      runs: 0,
      wickets: 0,
      strikeRate: 0,
      avgScore: 0,
    }
  ]);

  const [communityUsers, setCommunityUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  const lastFetchedVenueCommIdRef = useRef<number | null>(null);
  const refreshVenues = useCallback((force?: boolean) => {
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const activeCommId = isSuperAdmin ? (selectedCommId ? Number(selectedCommId) : undefined) : user?.communityId;
    
    if (!activeCommId) {
      setVenues([]);
      setSelectedVenueId("");
      lastFetchedVenueCommIdRef.current = null;
      return;
    }

    const selectedComm = communities.find(c => c.id === activeCommId);
    const isGeneral = selectedComm
      ? (selectedComm.type === "GENERAL" || selectedComm.name.toLowerCase() === "general")
      : ((user as any)?.community?.type === "GENERAL" || (user as any)?.community?.name?.toLowerCase() === "general");

    const fetchId = isGeneral ? user?.communityId : activeCommId;
    if (fetchId !== undefined) {
      if (force !== true && lastFetchedVenueCommIdRef.current === fetchId) {
        return;
      }
      lastFetchedVenueCommIdRef.current = fetchId;
      venueService.getVenues(fetchId).then(setVenues).catch(() => { });
    }
  }, [selectedCommId, user?.communityId, user?.role, communities, (user as any)?.community]);

  // Load Community Users for "Your Friends" left side panel
  useEffect(() => {
    if (showAddPlayerModal) {
      const commId = user?.communityId || selectedCommId;
      if (commId) {
        setLoadingUsers(true);
        userService.getCommunityUsers(Number(commId))
          .then(res => {
            setCommunityUsers(res || []);
          })
          .catch(err => {
            console.error("Failed to load community users", err);
          })
          .finally(() => {
            setLoadingUsers(false);
          });
      }
    }
  }, [showAddPlayerModal, user?.communityId, selectedCommId]);

  // Friend Selection Handler
  const handleSelectFriend = (friend: any) => {
    setAddPlayerForms(prev => {
      // Check if player is already added
      if (prev.some(p => p.playerEmail === friend.email || p.playerName === friend.fullName)) {
        toast.warning("Player is already in the list");
        return prev;
      }
      const newCard = {
        id: Math.random().toString(),
        playerName: friend.fullName,
        playerEmail: friend.email || "",
        categoryId: playerCategories[0]?.id ? String(playerCategories[0].id) : "",
        avatarUrl: friend.avatarUrl || "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media",
        matchType: "SINGLES",
        age: friend.dateOfBirth ? new Date().getFullYear() - new Date(friend.dateOfBirth).getFullYear() : 25,
        flatNumber: friend.flatNo || "",
        relation: "SELF",
        role: "",
        matches: 0,
        runs: 0,
        wickets: 0,
        strikeRate: 0,
        avgScore: 0,
      };
      // If the first card is empty and pristine, replace it
      if (prev.length === 1 && !prev[0].playerName.trim() && !prev[0].playerEmail.trim()) {
        return [newCard];
      }
      return [...prev, newCard];
    });
    toast.success(`Selected ${friend.fullName}`);
  };

  // Add blank card handler
  const handleAddNewPlayerCard = () => {
    setAddPlayerForms(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        playerName: "",
        playerEmail: "",
        categoryId: playerCategories[0]?.id ? String(playerCategories[0].id) : "",
        avatarUrl: "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media",
        matchType: "SINGLES",
        age: 25,
        flatNumber: "",
        relation: "OTHER",
        role: "",
        matches: 0,
        runs: 0,
        wickets: 0,
        strikeRate: 0,
        avgScore: 0,
      }
    ]);
  };

  // Delete card handler
  const handleDeletePlayerCard = (cardId: string) => {
    setAddPlayerForms(prev => {
      const updated = prev.filter(c => c.id !== cardId);
      if (updated.length === 0) {
        return [{
          id: Math.random().toString(),
          playerName: "",
          playerEmail: "",
          categoryId: playerCategories[0]?.id ? String(playerCategories[0].id) : "",
          avatarUrl: "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media",
          matchType: "SINGLES",
          age: 25,
          flatNumber: "",
          relation: "OTHER",
          role: "",
          matches: 0,
          runs: 0,
          wickets: 0,
          strikeRate: 0,
          avgScore: 0,
        }];
      }
      return updated;
    });
  };

  // DOB Formatter
  const formatDob = (dobString?: string) => {
    if (!dobString) return "";
    try {
      return format(new Date(dobString), "MMM d, yyyy");
    } catch {
      return dobString;
    }
  };

  // Filter Friends
  const filteredFriends = communityUsers.filter(u =>
    u.fullName.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(friendSearchQuery.toLowerCase()))
  );

  // ─── Manual Add Player Submit Handler ───
  const handleAddPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventIdForAdd) return;

    // Validation
    for (let idx = 0; idx < addPlayerForms.length; idx++) {
      const form = addPlayerForms[idx];
      if (!form.playerName.trim()) {
        toast.error(`Player Name is required for card #${idx + 1}`);
        return;
      }
      if (!form.playerEmail.trim()) {
        toast.error(`Player Email is required for card #${idx + 1}`);
        return;
      }
      if (!form.categoryId) {
        toast.error(`Player Category is required for card #${idx + 1}`);
        return;
      }
    }

    setSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const form of addPlayerForms) {
        try {
          await sportsService.registerForEvent({
            eventId: selectedEventIdForAdd,
            categoryId: Number(form.categoryId),
            matchType: form.matchType,
            role: form.role,
            age: Number(form.age),
            matches: Number(form.matches),
            runs: Number(form.runs),
            wickets: Number(form.wickets),
            strikeRate: Number(form.strikeRate),
            avgScore: Number(form.avgScore),
            playerName: form.playerName,
            relation: form.relation,
            flatNumber: form.flatNumber,
          });
          successCount++;
        } catch (err: any) {
          console.error(`Failed to register player ${form.playerName}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully registered ${successCount} participant(s)!`);
      }
      if (failCount > 0) {
        toast.error(`Failed to register ${failCount} participant(s)`);
      }

      setShowAddPlayerModal(false);

      // Reset dynamic forms
      setAddPlayerForms([
        {
          id: Math.random().toString(),
          playerName: "",
          playerEmail: "",
          categoryId: playerCategories[0]?.id ? String(playerCategories[0].id) : "",
          avatarUrl: "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media",
          matchType: "SINGLES",
          age: 25,
          flatNumber: "",
          relation: "OTHER",
          role: "",
          matches: 0,
          runs: 0,
          wickets: 0,
          strikeRate: 0,
          avgScore: 0,
        }
      ]);

      // Refresh registrations list
      if (viewingEventId) {
        const regs = await sportsService.getEventRegistrations(viewingEventId);
        setRegistrations(regs);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to add participants");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── CSV Download Sample Template ───
  const handleDownloadSample = () => {
    const csvContent = "Player Name,Email,Category,Age,Flat Number,Relation,Primary Role,Matches,Runs,Wickets,Strike Rate,Avg Score\n" +
      "Rahul Sharma,rahul.sharma@gmail.com,Men's Open,28,B-402,OTHER,Right Hand Batsman,15,350,4,135.5,28.5\n" +
      "Priya Patel,priya.patel@gmail.com,Women's Open,24,C-101,SPOUSE,Right Arm Fast,10,80,12,110.0,15.2";
      
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_participants.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── CSV File Selection Handler ───
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setParsingError(null);
    // Parse CSV
    import("papaparse").then((Papa) => {
      Papa.default.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors);
          }
          setParsedRows(results.data);
        },
        error: (err) => {
          setParsingError("Failed to parse CSV file: " + err.message);
        }
      });
    });
    setImportStep(2);
  };

  // ─── CSV Import Submit Handler ───
  const handleImportSubmit = async () => {
    if (!selectedEventIdForImport || parsedRows.length === 0) {
      toast.error("No data to import");
      return;
    }
    
    setImporting(true);
    setImportProgress(0);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      
      // Helper function to extract cell value with multiple alias support
      const getVal = (aliases: string[]) => {
        for (const alias of aliases) {
          const key = Object.keys(row).find(k => k.toLowerCase().replace(/[\s_-]/g, '') === alias.toLowerCase().replace(/[\s_-]/g, ''));
          if (key && row[key] !== undefined) return String(row[key]).trim();
        }
        return "";
      };
      
      const name = getVal(["name", "playerName", "fullName", "player"]);
      if (!name) {
        failCount++;
        continue;
      }

      const email = getVal(["email", "emailId", "mail", "emailAddress"]);

      const categoryName = getVal(["category", "playerCategory", "class", "division"]);
      
      // Find category ID based on category name matching
      let categoryId = playerCategories[0]?.id || 1;
      if (categoryName) {
        const matchedCat = playerCategories.find(c => 
          c.name.toLowerCase().replace(/[\s_-]/g, '') === categoryName.toLowerCase().replace(/[\s_-]/g, '')
        );
        if (matchedCat) categoryId = matchedCat.id;
      }
      
      const ageVal = getVal(["age", "playerAge"]);
      const age = ageVal ? parseInt(ageVal) || 25 : 25;
      
      const flat = getVal(["flat", "flatNumber", "flatNo", "flatNum"]);
      const relation = getVal(["relation", "relationship"]) || "OTHER";
      const role = getVal(["role", "primaryRole", "playerRole"]);
      const matches = parseInt(getVal(["matches", "matchCount", "played"])) || 0;
      const runs = parseInt(getVal(["runs", "points", "totalRuns", "totalPoints"])) || 0;
      const wickets = parseInt(getVal(["wickets", "assists", "totalWickets", "totalAssists"])) || 0;
      const strikeRate = parseFloat(getVal(["strikeRate", "strike_rate"])) || 0.0;
      const avgScore = parseFloat(getVal(["avgScore", "avg_score", "averageScore"])) || 0.0;
      
      try {
        await sportsService.registerForEvent({
          eventId: selectedEventIdForImport,
          categoryId,
          matchType: "SINGLES",
          role,
          age,
          matches,
          runs,
          wickets,
          strikeRate,
          avgScore,
          playerName: name,
          email,
          relation,
          flatNumber: flat,
        });
        successCount++;
      } catch (err) {
        console.error(`Import failed for row ${i + 1} (${name}):`, err);
        failCount++;
      }
      
      setImportProgress(Math.round(((i + 1) / parsedRows.length) * 100));
    }
    
    toast.success(`Import complete! Successfully added ${successCount} players. ${failCount > 0 ? `Failed to add ${failCount} players.` : ""}`);
    
    // Close modal & reset progress
    setShowImportModal(false);
    setCsvFile(null);
    setParsedRows([]);
    setImportProgress(null);
    setImporting(false);
    
    // Refresh players list
    if (viewingEventId) {
      const regs = await sportsService.getTournamentRegistrations(viewingEventId);
      setRegistrations(regs);
    }
  };

  const refreshTournaments = useCallback(() => {
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const targetId = isSuperAdmin ? null : user?.communityId;
    if (isSuperAdmin) {
      sportsService.getAllTournaments().then(setActiveTournaments).catch(() => { });
    } else if (targetId) {
      sportsService.getCommunityTournaments(targetId).then(setActiveTournaments).catch(() => { });
    }
  }, [user?.role, user?.communityId]);

  const refreshEvents = useCallback(() => {
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const targetId = isSuperAdmin ? null : user?.communityId;
    if (isSuperAdmin) {
      sportsService.getAllEvents(true).then(setActiveEvents).catch(() => { });
    } else if (targetId) {
      sportsService.getCommunityEvents(targetId, true).then(setActiveEvents).catch(() => { });
    }
  }, [user?.role, user?.communityId]);

  const refreshCategories = useCallback(() => {
    sportsService.getCategories().then(setPlayerCategories).catch(() => { });
  }, []);

  // Load data the first time each tab becomes active; skip on revisits.
  // Mutations (save / delete / activate) refresh their own data directly.
  const fetchTournamentsOnce = useCallback(() => {
    if (tournamentsFetchedRef.current) return;
    tournamentsFetchedRef.current = true;
    refreshTournaments();
  }, [refreshTournaments]);

  const fetchEventsOnce = useCallback(() => {
    if (eventsFetchedRef.current) return;
    eventsFetchedRef.current = true;
    refreshEvents();
  }, [refreshEvents]);

  useEffect(() => {
    if (hydratedTabs.current.has(activeTab)) return;
    hydratedTabs.current.add(activeTab);

    switch (activeTab) {
      case "dashboard":
        fetchTournamentsOnce();
        fetchEventsOnce();
        refreshVenues();
        break;
      case "sports-event":
        fetchEventsOnce();
        fetchTournamentsOnce();
        sportsService.getSportsMeta().then(setSportsMeta).catch(() => {});
        sportsService.getCategories().then(setPlayerCategories).catch(() => {});
        break;
      case "teams":
        fetchTournamentsOnce();
        break;
      case "schedule":
        fetchTournamentsOnce();
        fetchEventsOnce();
        break;
      case "create-venue":
        communityService.getCommunities().then(setCommunities).catch(() => {});
        refreshVenues();
        break;
      case "player-category":
        refreshCategories();
        break;
      case "results":
        fetchTournamentsOnce();
        fetchEventsOnce();
        break;
      case "settings":
        break;
      case "sports-meta":
        sportsService.getSportsMeta().then(setSportsMeta).catch(() => {});
        break;
      case "create-tournament":
        sportsService.getSportsMeta().then(setSportsMeta).catch(() => {});
        sportsService.getCategories().then(setPlayerCategories).catch(() => {});
        communityService.getCommunities().then(setCommunities).catch(() => {});
        break;
      default:
        break;
    }
  }, [activeTab, fetchTournamentsOnce, fetchEventsOnce, refreshCategories, refreshVenues]);

  // Fetch venues on first visit to any tab that needs them; re-fetch when the
  // refreshVenues callback identity changes (community or role changed).
  const venueTabsNeedFetch = activeTab === "dashboard" || activeTab === "create-venue" || activeTab === "create-tournament" || activeTab === "sports-event";
  const lastVenuesFetchRef = useRef<typeof refreshVenues | null>(null);
  useEffect(() => {
    if (!venueTabsNeedFetch) return;
    // Re-fetch only if: first time on a venue-using tab, OR community/role changed
    if (lastVenuesFetchRef.current !== refreshVenues) {
      lastVenuesFetchRef.current = refreshVenues;
      refreshVenues();
    }
  }, [refreshVenues, venueTabsNeedFetch]);

  // Reactively fetch details of the selected venue (only when relevant tabs are active)
  useEffect(() => {
    if (activeTab === "create-venue" || activeTab === "create-tournament") {
      if (!selectedVenueId) {
        setSelectedVenueDetails(null);
        return;
      }
      
      setLoadingVenueDetails(true);
      venueService.getVenueById(Number(selectedVenueId))
        .then(res => {
          setSelectedVenueDetails(res);
        })
        .catch(err => {
          console.error("Failed to load venue details:", err);
          // Fallback to local venues state if API fails
          const localVenue = venues.find(v => v.id === Number(selectedVenueId));
          if (localVenue) {
            setSelectedVenueDetails(localVenue);
          } else {
            setSelectedVenueDetails(null);
          }
        })
        .finally(() => {
          setLoadingVenueDetails(false);
        });
    }
  }, [selectedVenueId, venues, activeTab]);

  // Fetch communities filtered by venue type for venue form (only when relevant tabs are active and venueType is selected)
  useEffect(() => {
    if (activeTab === "create-venue" || activeTab === "create-tournament") {
      if (venueType && venueType !== "OUTSIDE") {
        communityService.getCommunities(venueType).then(setVenueCommunities).catch(() => setVenueCommunities([]));
      } else {
        setVenueCommunities([]);
        setVenueCommId("");
      }
    }
  }, [venueType, activeTab]);

  const toggleSport = (id: number) => {
    setSelectedSports(prev => {
      const exists = prev.includes(id);
      const nextSports = exists ? prev.filter(x => x !== id) : [...prev, id];
      
      setSelectedSportsWithEvents(current => {
        if (exists) {
          return current.filter(x => x.sportId !== id);
        } else {
          const s = sportsMeta.find(meta => meta.id === id);
          if (!s) return current;
          const isTeam = isTeamSport(s.name);
          const defaultEvent: SportEventState = {
            id: Math.random().toString(),
            name: "",
            gender: "ALL",
            playersBorn: "1900-01-01",
            format: isTeam ? "TEAM" : "SINGLES",
            minPlayers: isTeam ? getDefaultMinPlayers(s.name) : undefined,
            maxPlayers: isTeam ? getDefaultMinPlayers(s.name) + 4 : undefined,
            tournamentType: s.tournamentType || "",
          };
          return [...current, {
            sportId: id,
            sportName: s.name,
            sportIcon: s.icon,
            sportIconUrl: s.iconUrl || undefined,
            events: [defaultEvent]
          }];
        }
      });
      
      return nextSports;
    });
  };

  const toggleSportsEvent = (e: any) => {
    setSelectedEventIds(prev => {
      const exists = prev.includes(e.id);
      const nextIds = exists ? prev.filter(id => id !== e.id) : [...prev, e.id];

      const sportId = e.sport?.id || 0;
      if (!sportId) return nextIds;

      setSelectedSportsWithEvents(current => {
        if (exists) {
          const updated = current.map(item => {
            if (item.sportId === sportId) {
              return {
                ...item,
                events: item.events.filter(evt => evt.id !== e.id.toString())
              };
            }
            return item;
          }).filter(item => item.events.length > 0);
          
          setSelectedSports(updated.map(x => x.sportId));
          return updated;
        } else {
          const isTeam = isTeamSport(e.sport?.name || "");
          const newEvent: SportEventState = {
            id: e.id.toString(),
            name: e.name || "",
            gender: e.gender || "ALL",
            playersBorn: e.playersBorn || "1900-01-01",
            format: e.format || (isTeam ? "TEAM" : "SINGLES"),
            minPlayers: e.minPlayers || (isTeam ? getDefaultMinPlayers(e.sport?.name || "") : undefined),
            maxPlayers: e.maxPlayers || (isTeam ? getDefaultMinPlayers(e.sport?.name || "") + 4 : undefined),
            tournamentType: e.tournamentType || "",
            eventId: e.id,
          };

          const sportItem = current.find(x => x.sportId === sportId);
          let nextCurrent;
          if (sportItem) {
            nextCurrent = current.map(item => {
              if (item.sportId === sportId) {
                return {
                  ...item,
                  events: [...item.events, newEvent]
                };
              }
              return item;
            });
          } else {
            nextCurrent = [...current, {
              sportId: sportId,
              sportName: e.sport?.name || "Sport",
              sportIcon: e.sport?.icon || "🏆",
              sportIconUrl: e.sport?.iconUrl || undefined,
              events: [newEvent]
            }];
          }

          setSelectedSports(nextCurrent.map(x => x.sportId));
          return nextCurrent;
        }
      });

      return nextIds;
    });
  };

  const addEventToSport = (sportId: number) => {
    const meta = sportsMeta.find(m => m.id === sportId);
    setSelectedSportsWithEvents(prev => prev.map(s => {
      if (s.sportId !== sportId) return s;
      const isTeam = isTeamSport(s.sportName);
      const newEvent: SportEventState = {
        id: Math.random().toString(),
        name: "",
        gender: "ALL",
        playersBorn: "1900-01-01",
        format: isTeam ? "TEAM" : "SINGLES",
        minPlayers: isTeam ? getDefaultMinPlayers(s.sportName) : undefined,
        maxPlayers: isTeam ? getDefaultMinPlayers(s.sportName) + 4 : undefined,
        tournamentType: meta?.tournamentType || "",
      };
      return {
        ...s,
        events: [...s.events, newEvent]
      };
    }));
  };

  const removeEvent = (sportId: number, eventId: string) => {
    setSelectedSportsWithEvents(prev => prev.map(s => {
      if (s.sportId !== sportId) return s;
      if (s.events.length <= 1) {
        toast.warning("A selected sport must have at least one event configuration.");
        return s;
      }
      return {
        ...s,
        events: s.events.filter(e => e.id !== eventId)
      };
    }));
  };

  const updateEventField = (sportId: number, eventId: string, field: keyof SportEventState, value: any) => {
    setSelectedSportsWithEvents(prev => prev.map(s => {
      if (s.sportId !== sportId) return s;
      return {
        ...s,
        events: s.events.map(e => {
          if (e.id !== eventId) return e;
          return { ...e, [field]: value };
        })
      };
    }));
  };

  const removeSportCard = (sportId: number) => {
    setSelectedSports(prev => prev.filter(x => x !== sportId));
    setSelectedSportsWithEvents(prev => prev.filter(x => x.sportId !== sportId));
  };

  const toggleCat = (id: number) =>
    setSelectedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!eventName.trim() && !editingEventId) { toast.error("Tournament name is required"); return; }
    if (selectedSports.length === 0) { toast.error("Select at least one sport"); return; }
    if (!startDate || !endDate) { toast.error("Dates are required"); return; }
    
    // Validate events
    for (const s of selectedSportsWithEvents) {
      for (const e of s.events) {
        if (!e.name.trim()) {
          toast.error(`Event name is required for sport: ${s.sportName}`);
          return;
        }
        if (isTeamSport(s.sportName)) {
          if (!e.minPlayers || e.minPlayers <= 0) {
            toast.error(`Valid Min Players is required for event "${e.name}" in sport ${s.sportName}`);
            return;
          }
          if (!e.maxPlayers || e.maxPlayers <= 0) {
            toast.error(`Valid Max Players is required for event "${e.name}" in sport ${s.sportName}`);
            return;
          }
          if (e.maxPlayers < e.minPlayers) {
            toast.error(`Max Players cannot be less than Min Players for event "${e.name}" in sport ${s.sportName}`);
            return;
          }
        } else {
          if (!e.format) {
            toast.error(`Participant Type is required for event "${e.name}" in sport ${s.sportName}`);
            return;
          }
        }
        if (!e.tournamentType) {
          toast.error(`Tournament Format is required for event "${e.name}" in sport ${s.sportName}`);
          return;
        }
      }
    }
    
    // Contact Information validations
    if (!eventContactName.trim()) { toast.error("Tournament Contact Name is required"); return; }
    if (!eventContactNumber.trim()) { toast.error("Tournament Contact Number is required"); return; }
    if (!eventContactEmail.trim()) { toast.error("Tournament Contact Email is required"); return; }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(eventContactEmail)) {
      toast.error("Please enter a valid Tournament Contact Email");
      return;
    }

    // Validate sponsors
    for (let i = 0; i < sponsors.length; i++) {
      const s = sponsors[i];
      if (!s.category.trim()) {
        toast.error(`Sponsor Category is required for sponsor #${i + 1}`);
        return;
      }
      if (!s.name.trim()) {
        toast.error(`Sponsor Name is required for sponsor #${i + 1}`);
        return;
      }
    }

    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const finalCommId = isSuperAdmin ? selectedCommId : user?.communityId;

    if (!finalCommId) { toast.error("Please select a community"); return; }

    const baseDate = getTournamentStartDateTime();
    const displayVenue = selectedVenueDetails?.name || "Sector 12 Ground, Block C";
    
    const displayStartDate = regStartDate 
      ? format(regStartDate, "dd MMM yyyy") 
      : "25 Nov 2026";
      
    const displayStartTime = startTime || "09:00 AM";
    
    let displayReportTime = "8:30 AM";
    if (baseDate) {
      const reportDate = new Date(baseDate.getTime() - 30 * 60000);
      displayReportTime = reportDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }

    const compileText = (text: string, currentEventName: string) => {
      if (!text) return "";
      const displayEventName = currentEventName.trim() || eventName.trim() || "Cricket League Season 2026";
      return text
        .replace(/{{tournament_name}}/g, displayEventName)
        .replace(/{{venue}}/g, displayVenue.split(",")[0])
        .replace(/{{start_date}}/g, displayStartDate)
        .replace(/{{start_time}}/g, displayStartTime)
        .replace(/{{report_time}}/g, displayReportTime);
    };

    const getNotificationPayloads = (currentEventName: string) => {
      return allTriggersToRender.map(t => ({
        id: t.id,
        label: t.label,
        offset: t.offset,
        enabled: t.enabled,
        title: compileText(t.title, currentEventName),
        body: compileText(t.body, currentEventName),
        recipients: t.recipients,
        overrideChannels: t.overrideChannels && t.overrideChannels.length > 0 ? t.overrideChannels : globalChannels,
        priority: t.priority || "NORMAL",
        isCustom: t.isCustom
      }));
    };

    setSubmitting(true);
    try {
      if (editingEventId) {
        const singleSport = selectedSportsWithEvents[0];
        const singleEvent = singleSport?.events[0];
        if (!singleEvent) {
          toast.error("No event configuration found to save");
          setSubmitting(false);
          return;
        }
        const isTeam = isTeamSport(singleSport.sportName);
        const targetEventIds = selectedSportsWithEvents.flatMap(s => s.events.map(e => e.eventId).filter(id => id != null).map(Number));
        const payload = {
          name: singleEvent.name,
          communityId: Number(finalCommId),
          venueId: selectedVenueId ? Number(selectedVenueId) : undefined,
          eventDateStart: format(startDate, "yyyy-MM-dd"),
          eventDateEnd: format(endDate, "yyyy-MM-dd"),
          registrationDateStart: regStartDate ? format(regStartDate, "yyyy-MM-dd") : undefined,
          registrationDateEnd: regEndDate ? format(regEndDate, "yyyy-MM-dd") : undefined,
          startTime: startTime,
          dueTime: dueTime,
          maxParticipants: parseInt(maxPax) || undefined,
          contactName: eventContactName,
          contactNumber: eventContactNumber,
          contactEmail: eventContactEmail,
          otherContacts: JSON.stringify(otherContacts.filter(c => c.title.trim() || c.name.trim() || c.detail.trim())),
          sponsors: sponsors.filter(s => s.category.trim() && s.name.trim()),
          bannerImage: bannerImage,
          tournamentLevel: tournamentLevel,
          description: description,
          allowAdminChat: allowAdminChat,
          notifications: getNotificationPayloads(singleEvent.name),
          sportsEventIds: targetEventIds,
        };
        await sportsService.updateTournament(editingEventId, payload as any);
        toast.success("Tournament updated successfully!");
      } else {
        const targetEventIds = selectedSportsWithEvents.flatMap(s => s.events.map(e => e.eventId).filter(id => id != null).map(Number));
        const payload = {
          name: eventName,
          communityId: Number(finalCommId),
          venueId: selectedVenueId ? Number(selectedVenueId) : undefined,
          eventDateStart: format(startDate, "yyyy-MM-dd"),
          eventDateEnd: format(endDate, "yyyy-MM-dd"),
          registrationDateStart: regStartDate ? format(regStartDate, "yyyy-MM-dd") : undefined,
          registrationDateEnd: regEndDate ? format(regEndDate, "yyyy-MM-dd") : undefined,
          startTime: startTime,
          dueTime: dueTime,
          maxParticipants: parseInt(maxPax) || undefined,
          contactName: eventContactName,
          contactNumber: eventContactNumber,
          contactEmail: eventContactEmail,
          otherContacts: JSON.stringify(otherContacts.filter(c => c.title.trim() || c.name.trim() || c.detail.trim())),
          sponsors: sponsors.filter(sp => sp.category.trim() && sp.name.trim()),
          bannerImage: bannerImage,
          tournamentLevel: tournamentLevel,
          description: description,
          allowAdminChat: allowAdminChat,
          notifications: getNotificationPayloads(eventName),
          sportsEventIds: targetEventIds,
        };
        await sportsService.createTournament(payload as any);
        toast.success("Tournament created successfully!");
      }

      resetForm();
      // Invalidate dashboard so the next visit re-fetches fresh tournament list
      hydratedTabs.current.delete("sports-event");
      setActiveTab("sports-event");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save tournament(s)");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEventName("");
    setSelectedVenueId("");
    setStartDate(undefined);
    setEndDate(undefined);
    setRegStartDate(undefined);
    setRegEndDate(undefined);
    setSelectedSports([]);
    setSelectedSportsWithEvents([]);
    setSelectedCats([]);
    setSelectedCommId("");
    setEventContactName("");
    setEventContactNumber("");
    setEventContactEmail("");
    setOtherContacts([]);
    setSponsors([]);
    setBannerImage("");
    setTournamentLevel("Standard");
    setDescription("");
    setAllowAdminChat(false);
    setStartTime("09:00 AM");
    setDueTime("06:00 PM");
    setEditingEventId(null);
    setSelectedEventIds([]);

    // Reset notification schedule
    setGlobalChannels(["push", "email"]);
    setPreviewTrigger("2h");
    setExpandedTrigger(null);
    setCustomTriggers([]);
    setTriggerStates({
      "7d": {
        enabled: true,
        title: "🏏 Tournament Registration Open!",
        body: "Registration is now open for {{tournament_name}}! 🏆 Starting {{start_date}} at {{venue}}. Register before spots fill up. Tap to register now.",
        recipients: ["All Members", "Community Feed"],
        overrideChannels: ["push", "email", "whatsapp"]
      },
      "1d": {
        enabled: true,
        title: "🏆 Tournament Tomorrow!",
        body: "{{tournament_name}} begins TOMORROW at {{start_time}}! 📍 {{venue}}. Your match schedule is ready. Check your fixtures and prepare. See you on the ground! 🏅",
        recipients: ["Registered Players", "Team Owners", "Admins Only"],
        overrideChannels: []
      },
      "2h": {
        enabled: true,
        title: "⚡ 2 Hours to Kick-Off!",
        body: "⚡ {{tournament_name}} starts in 2 hours! Report at {{venue}} by {{report_time}}. Bring your kit & ID. Your first match is ready! Let's go! 🏏",
        recipients: ["Registered Players", "Team Owners", "Referees"],
        overrideChannels: []
      },
      "30m": {
        enabled: true,
        title: "🔴 30 Mins to Start — Head to Ground!",
        body: "🔴 FINAL CALL — {{tournament_name}} begins in 30 minutes! Head to {{venue}} NOW. Gate A open. Toss in 15 mins. Don't be late — matches won't be delayed! ⏱️",
        recipients: ["Registered Players", "Referees"],
        overrideChannels: ["push", "sms", "whatsapp", "inapp"]
      },
      "now": {
        enabled: true,
        title: "🏁 Tournament is LIVE Now!",
        body: "🏁 {{tournament_name}} has officially started! Follow live scores, results, and standings right here in the app. Play hard! 🏆",
        recipients: ["All Members", "Spectators", "Community Feed"],
        overrideChannels: []
      }
    });
  };

  const handleEdit = (tournamentOrEvent: any) => {
    // If it's a tournament object from the tournament table, extract the nested event and merge
    const ev = tournamentOrEvent.event
      ? {
          ...tournamentOrEvent.event,
          id: tournamentOrEvent.event.id,
          name: tournamentOrEvent.name || tournamentOrEvent.event.name,
          tournamentId: tournamentOrEvent.id
        }
      : tournamentOrEvent;

    setEventName(ev.name);
    setSelectedVenueId(ev.venue?.id ?? "");
    setStartDate(new Date(ev.eventDateStart));
    setEndDate(new Date(ev.eventDateEnd));
    setRegStartDate(ev.registrationDateStart ? new Date(ev.registrationDateStart) : undefined);
    setRegEndDate(ev.registrationDateEnd ? new Date(ev.registrationDateEnd) : undefined);
    setSelectedSports([ev.sport?.id]);
    
    const isTeam = isTeamSport(ev.sport?.name || "");
    const existingEvent: SportEventState = {
      id: ev.id ? String(ev.id) : Math.random().toString(),
      name: ev.name || "",
      gender: ev.gender || "ALL",
      playersBorn: ev.playersBorn || "1900-01-01",
      format: ev.format || (isTeam ? "TEAM" : "SINGLES"),
      minPlayers: ev.minPlayers,
      maxPlayers: ev.maxPlayers,
      tournamentType: ev.tournamentType || "",
      eventId: ev.id,
    };
    setSelectedSportsWithEvents([{
      sportId: ev.sport?.id,
      sportName: ev.sport?.name || "",
      sportIcon: ev.sport?.icon || "",
      sportIconUrl: ev.sport?.iconUrl || undefined,
      events: [existingEvent]
    }]);

    setSelectedCats(ev.categories?.map((c: any) => c.id) ?? []);
    setSelectedCommId(ev.community?.id ?? "");
    setEventContactName(ev.contactName || "");
    setEventContactNumber(ev.contactNumber || "");
    setEventContactEmail(ev.contactEmail || "");
    setOtherContacts(parseOtherContacts(ev.otherContacts));
    setSponsors(ev.sponsors || []);
    setBannerImage(ev.bannerImage || "");
    setTournamentLevel(ev.tournamentLevel || "Standard");
    setDescription(ev.description || "");
    setAllowAdminChat(ev.allowAdminChat || false);
    setStartTime(ev.startTime || "09:00 AM");
    setDueTime(ev.dueTime || "06:00 PM");

    // Load notification schedules if present
    if (ev.premiumNotifications && ev.premiumNotifications.length > 0) {
      const custom: any[] = [];
      const updatedDefaults = { ...triggerStates };

      ev.premiumNotifications.forEach((item: any) => {
        const recipientsList = item.recipients ? item.recipients.split(",") : [];
        const channelsList = item.channels ? item.channels.split(",") : [];
        
        const triggerId = item.triggerKey || String(item.id);
        const isDefaultKey = ["7d", "1d", "2h", "30m", "now"].includes(triggerId);

        if (isDefaultKey && !item.isCustom) {
          updatedDefaults[triggerId] = {
            enabled: item.enabled,
            title: item.title,
            body: item.body,
            recipients: recipientsList,
            overrideChannels: channelsList
          };
        } else {
          custom.push({
            id: triggerId,
            label: item.label || "Custom Trigger",
            offset: item.offsetMinutes || 0,
            enabled: item.enabled,
            title: item.title,
            body: item.body,
            recipients: recipientsList,
            overrideChannels: channelsList,
            priority: item.priority || "NORMAL",
            isCustom: true
          });
        }
      });

      setTriggerStates(updatedDefaults);
      setCustomTriggers(custom);
    }

    setEditingEventId(ev.id);
    setSelectedEventIds(ev.id ? [ev.id] : []);
    setActiveTab("create-tournament");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleActivate = (id: number) => {
    const tournament = activeTournaments.find(t => t.id === id);
    const name = tournament?.name || "Tournament";
    setActivatingTournament({ id, name });
  };

  const handleConfirmActivate = async (config: RegistrationNotifConfig) => {
    if (!activatingTournament) return;
    // Status update is the critical step — throw on failure so modal stays open
    await sportsService.updateTournamentStatus(activatingTournament.id, "REGISTRATION_OPEN");
    setActivatingTournament(null);
    refreshTournaments();
    refreshEvents();
    // Notification dispatch is secondary — warn but don't block
    try {
      await notificationService.sendRegistrationOpenNotification(activatingTournament.id, {
        sendEmail: config.sendEmail,
        sendPush: config.sendPush,
        sendSms: config.sendSms,
        message: config.message,
      });
      toast.success("Tournament opened for registration! Notifications sent to community.");
    } catch {
      toast.warning("Tournament opened for registration. Notifications could not be sent.");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmAction(
      "Delete Tournament",
      "Are you sure you want to delete this tournament?"
    );
    if (!confirmed) return;
    try {
      await sportsService.deleteTournament(id);
      toast.success("Tournament deleted");
      refreshTournaments();
    } catch (err) {
      toast.error("Failed to delete tournament");
    }
  };

  // ─── Registration handlers ────────────────────────────────────────────
  const handleViewPlayers = async (eventId: number) => {
    if (viewingEventId === eventId && viewMode === "players") {
      setViewingEventId(null);
      setRegistrations([]);
      return;
    }
    setViewingEventId(eventId);
    setViewMode("players");
    setNominatedCaptains([]);
    setLoadingRegs(true);
    try {
      const regs = await sportsService.getTournamentRegistrations(eventId);
      setRegistrations(regs);
    } catch {
      toast.error("Failed to load players");
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleViewCaptains = async (eventId: number) => {
    if (viewingEventId === eventId && viewMode === "captains") {
      setViewingEventId(null);
      setNominatedCaptains([]);
      return;
    }
    setViewingEventId(eventId);
    setViewMode("captains");
    setRegistrations([]);
    setLoadingRegs(true);
    try {
      const caps = await auctionService.getNominatedCaptains(eventId);
      setNominatedCaptains(caps);
    } catch {
      toast.error("Failed to load captains");
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleConfirmRegistration = async (regId: number) => {
    try {
      await sportsService.confirmRegistration(regId);
      toast.success("Player confirmed!");
      if (viewingEventId && viewMode === "players") {
        const regs = await sportsService.getTournamentRegistrations(viewingEventId);
        setRegistrations(regs);
      }
    } catch {
      toast.error("Failed to confirm registration");
    }
  };

  const handleRejectRegistration = async (regId: number) => {
    const reason = window.prompt("Reason for rejection (optional):") ?? undefined;
    try {
      await sportsService.rejectRegistration(regId, reason || undefined);
      toast.success("Registration rejected");
      if (viewingEventId && viewMode === "players") {
        const regs = await sportsService.getTournamentRegistrations(viewingEventId);
        setRegistrations(regs);
      }
    } catch {
      toast.error("Failed to reject registration");
    }
  };

  const handleConfirmCaptain = async (id: number, confirm: boolean) => {
    try {
      await auctionService.confirmCaptainByTeamId(id, confirm);
      toast.success(confirm ? "Captain confirmed!" : "Captain nomination rejected!");
      if (viewingEventId && viewMode === "captains") {
        const caps = await auctionService.getNominatedCaptains(viewingEventId);
        setNominatedCaptains(caps);
      }
    } catch {
      toast.error("Failed to update captain status");
    }
  };

  // ─── Venue CRUD ─────────────────────────────────────────────────────

  const resetVenueForm = () => {
    setVenueName(""); setVenueAddress(""); setVenueCity(""); setVenueArea("");
    setVenueMapLink(""); setVenueCapacity("");
    setVenueOpeningTime("08:00 AM"); setVenueClosingTime("08:00 PM");
    setVenueType(""); setVenueCommId("");
    setCourts([]);
    setVenueContacts([{ name: "", title: "", number: "", email: "" }]);
    setVenuePinCode("");
    setEditingVenueId(null); setShowVenueForm(false);
  };

  const handleVenueEdit = (v: Venue) => {
    setVenueName(v.name); setVenueAddress(v.address || ""); setVenueCity(v.city || "");
    setVenueArea(v.area || ""); setVenueMapLink(v.mapLink || "");
    setVenueCapacity(v.capacity ? String(v.capacity) : "");
    setVenueOpeningTime(v.openingTime || "08:00 AM");
    setVenueClosingTime(v.closingTime || "08:00 PM");
    setVenueType(v.venueType || "");
    setCourts(v.courts || []);
    if (v.contacts && v.contacts.length > 0) {
      setVenueContacts(v.contacts.map(c => ({
        id: c.id,
        name: c.name || "",
        title: c.title || "",
        number: c.number || "",
        email: c.email || ""
      })));
    } else {
      setVenueContacts([{
        name: v.contactName || "",
        title: v.contactTitle || "",
        number: v.contactNumber || "",
        email: v.contactEmail || ""
      }]);
    }
    setVenuePinCode(v.pinCode || "");
    setEditingVenueId(v.id); setShowVenueForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleVenueDelete = async (id: number) => {
    const confirmed = await confirmAction(
      "Delete Venue",
      "Delete this venue? This may affect existing events."
    );
    if (!confirmed) return;
    try {
      await venueService.deleteVenue(id);
      toast.success("Venue deleted"); refreshVenues(true);
    } catch { toast.error("Failed to delete venue"); }
  };

  const handleVenueHide = (id: number) => {
    setHiddenVenues(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleVenueSave = async () => {
    if (!venueName.trim()) { toast.error("Venue name is required"); return; }
    if (!venueOpeningTime) { toast.error("Opening time is required"); return; }
    if (!venueClosingTime) { toast.error("Closing time is required"); return; }
    if (!venueType) { toast.error("Venue type is required"); return; }
    if (venueType !== "OUTSIDE" && !venueCommId && user?.role === "SUPER_ADMIN") {
      toast.error("Community is required"); return;
    }

    // Validate venueContacts
    if (!venueContacts || venueContacts.length === 0) {
      toast.error("At least one contact is required");
      return;
    }
    for (let i = 0; i < venueContacts.length; i++) {
      const c = venueContacts[i];
      if (!c.name?.trim()) { toast.error(`Contact #${i + 1} Name is required`); return; }
      if (!c.number?.trim()) { toast.error(`Contact #${i + 1} Number is required`); return; }
      if (!c.email?.trim()) { toast.error(`Contact #${i + 1} Email is required`); return; }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(c.email)) {
        toast.error(`Please enter a valid email for Contact #${i + 1}`);
        return;
      }
    }

    setVenueSubmitting(true);
    try {
      const commId = venueCommId ? Number(venueCommId) : (user?.role === "SUPER_ADMIN" ? null : user?.communityId);
      const selectedCommunity = venueCommunities.find(c => c.id === commId);
      const category = selectedCommunity ? selectedCommunity.type : "APARTMENT";

      const payload = {
        name: venueName, address: venueAddress, city: venueCity, area: venueArea,
        mapLink: venueMapLink, capacity: venueCapacity ? parseInt(venueCapacity) : undefined,
        openingTime: venueOpeningTime,
        closingTime: venueClosingTime,
        venueType, venueCategory: category,
        courts,
        contactName: venueContacts[0]?.name || "",
        contactNumber: venueContacts[0]?.number || "",
        contactEmail: venueContacts[0]?.email || "",
        contactTitle: venueContacts[0]?.title || "",
        contacts: venueContacts,
        pinCode: venuePinCode,
      };

      if (editingVenueId) {
        await venueService.updateVenue(editingVenueId, payload);
        toast.success("Venue updated!");
      } else {
        await venueService.createVenue(commId, payload);
        toast.success("Venue created!");
      }
      resetVenueForm(); refreshVenues(true);
    } catch (err) {
      console.error("Save venue error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save venue");
    } finally { setVenueSubmitting(false); }
  };

  // ─── Player Category CRUD ───────────────────────────────────────────

  const resetCategoryForm = () => {
    setCategoryName(""); setCategoryType(""); setCategoryDescription("");
    setCategoryMinAge(""); setCategoryMaxAge(""); setCategoryGender("");
    setCategoryCommId(""); setEditingCategoryId(null); setShowCategoryForm(false);
  };

  const handleCategoryEdit = (c: PlayerCategory) => {
    setCategoryName(c.name); setCategoryType(c.categoryType || "");
    setCategoryDescription(c.description || "");
    setCategoryMinAge(c.minAge != null ? String(c.minAge) : "");
    setCategoryMaxAge(c.maxAge != null ? String(c.maxAge) : "");
    setCategoryGender(c.gender || ""); setCategoryCommId(c.communityId || "");
    setEditingCategoryId(c.id); setShowCategoryForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryDelete = async (id: number) => {
    const confirmed = await confirmAction(
      "Delete Category",
      "Delete this player category? This may affect existing players."
    );
    if (!confirmed) return;
    try {
      await sportsService.deleteCategory(id);
      toast.success("Category deleted"); refreshCategories();
    } catch { toast.error("Failed to delete category"); }
  };

  const handleCategorySave = async () => {
    if (!categoryName.trim()) { toast.error("Category name is required"); return; }
    if (!categoryType) { toast.error("Category Type is required"); return; }
    if (!categoryGender) { toast.error("Gender is required"); return; }
    if (!categoryMinAge || !categoryMaxAge) { toast.error("Age range is required"); return; }
    setCategorySubmitting(true);
    try {
      const commId = categoryCommId ? Number(categoryCommId) : (user?.role === "SUPER_ADMIN" ? undefined : user?.communityId);
      const payload = {
        name: categoryName, categoryType: categoryType, description: categoryDescription,
        minAge: parseInt(categoryMinAge), maxAge: parseInt(categoryMaxAge),
        gender: categoryGender, communityId: commId,
      };
      if (editingCategoryId) {
        await sportsService.updateCategory(editingCategoryId, payload);
        toast.success("Category updated!");
      } else {
        await sportsService.createCategory(payload);
        toast.success("Category created!");
      }
      resetCategoryForm(); refreshCategories();
    } catch (err) {
      console.error("Save category error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save category");
    } finally { setCategorySubmitting(false); }
  };

  // Normalises an event's otherContacts (stored as a JSON string by the API)
  // into the array shape used by the forms.
  const parseOtherContacts = (raw: any): { title: string; name: string; detail: string; }[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // ─── Sports Event CRUD ───────────────────────────────────────────
  const createDefaultEvent = (sportName: string): SportFormEvent => {
    const isTeam = isTeamSport(sportName);
    return {
      id: Math.random().toString(36).substring(2),
      eventName: "",
      startDate: "",
      endDate: "",
      gender: "ALL",
      playersBorn: "1900-01-01",
      format: isTeam ? "TEAM" : "",
      formats: isTeam ? ["TEAM"] : [],
      minPlayers: isTeam ? String(getDefaultMinPlayers(sportName)) : "",
      maxPlayers: isTeam ? String(getDefaultMinPlayers(sportName) + 4) : "",
      minAge: "10",
      maxAge: "70",
      tournamentType: "",
      venueId: "",
      contactName: "",
      contactNumber: "",
      contactEmail: "",
      otherContacts: [],
      auctionEnabled: false,
      adminApprovalRequired: true,
    };
  };

  const resetSportForm = () => {
    setSportForms([]);
    setShowSportForm(false);
    setShowSportPicker(false);
    setSportPickerSearch("");
  };

  const handleSportPickerSelect = async (sport: { name: string; icon: string }) => {
    let dbSport = sportsMeta.find(s => s.name.toLowerCase() === sport.name.toLowerCase());
    if (!dbSport) {
      try {
        dbSport = await sportsService.createSport({
          name: sport.name,
          icon: sport.icon || "🏆",
          formats: ["SINGLES"],
          active: true
        } as any);
        toast.success(`Global Sport Meta "${sport.name}" registered!`);
        const updatedMeta = await sportsService.getSportsMeta();
        setSportsMeta(updatedMeta);
      } catch (err: any) {
        toast.error(`Failed to register "${sport.name}" in global Sports Meta: ${err.message}`);
        return;
      }
    }
    const existsInForms = sportForms.some(f => f.sportId === dbSport.id);
    if (existsInForms) {
      toast.warning(`"${sport.name}" is already queued in the form below.`);
      return;
    }

    const newEntry: SportFormEntry = {
      id: Math.random().toString(36).substring(2),
      name: dbSport.name,
      icon: dbSport.icon || "🏆",
      iconUrl: dbSport.iconUrl || undefined,
      sportId: dbSport.id,
      editingSportId: null,
      events: [createDefaultEvent(dbSport.name)],
    };
    setSportForms(prev => [...prev, newEntry]);
    setShowSportPicker(false);
    setSportPickerSearch("");
    setShowSportForm(true);
  };

  const handleCreateCustomSport = async () => {
    const trimmedName = customSportName.trim();
    if (!trimmedName) {
      toast.error("Sport name is required");
      return;
    }
    
    setSportSubmitting(true);
    try {
      let dbSport = sportsMeta.find(s => s.name.toLowerCase() === trimmedName.toLowerCase());
      if (!dbSport) {
        dbSport = await sportsService.createSport({
          name: trimmedName,
          icon: customSportIcon || "🏆",
          formats: [customSportFormat],
          active: true
        } as any);
        toast.success(`Global Sport Meta "${trimmedName}" created!`);
        sportsService.getSportsMeta().then(setSportsMeta).catch(() => {});
      }

      const existsInForms = sportForms.some(f => f.sportId === dbSport.id);
      if (existsInForms) {
        toast.warning(`"${trimmedName}" is already queued in the form below.`);
        return;
      }

      const newEntry: SportFormEntry = {
        id: Math.random().toString(36).substring(2),
        name: dbSport.name,
        icon: dbSport.icon || "🏆",
        iconUrl: dbSport.iconUrl || undefined,
        sportId: dbSport.id,
        editingSportId: null,
        events: [createDefaultEvent(dbSport.name)],
      };
      setSportForms(prev => [...prev, newEntry]);
      setShowSportPicker(false);
      setSportPickerSearch("");
      setCustomSportName("");
      setCustomSportFormat("SINGLES");
      setCustomSportIcon("🏆");
      setShowSportForm(true);
      toast.success(`Event queued for "${trimmedName}".`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create custom sport metadata.");
    } finally {
      setSportSubmitting(false);
    }
  };

  const removeSportForm = (formId: string) => {
    setSportForms(prev => {
      const updated = prev.filter(f => f.id !== formId);
      if (updated.length === 0) {
        setShowSportForm(false);
      }
      return updated;
    });
  };

  const updateSportForm = (formId: string, field: keyof SportFormEntry, value: any) => {
    setSportForms(prev => prev.map(f => f.id === formId ? { ...f, [field]: value } : f));
  };

  const addEventToSportForm = (formId: string) => {
    setSportForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      return { ...f, events: [...f.events, createDefaultEvent(f.name)] };
    }));
  };

  const removeEventFromSportForm = (formId: string, eventId: string) => {
    setSportForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      if (f.events.length <= 1) {
        toast.warning("A sport must have at least one event configuration.");
        return f;
      }
      return { ...f, events: f.events.filter(ev => ev.id !== eventId) };
    }));
  };

  const updateSportFormEvent = (formId: string, eventId: string, field: any, value: any) => {
    setSportForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      return {
        ...f,
        events: f.events.map(ev => {
          if (ev.id === eventId) {
            if (field === "format" && value === "TEAM") {
              return { ...ev, [field]: value, formats: ["TEAM"] };
            }
            return { ...ev, [field]: value };
          }
          return ev;
        }),
      };
    }));
  };

  const applyCategoryToSportFormEvent = (formId: string, eventId: string, category: PlayerCategory) => {
    setSportForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      return {
        ...f,
        events: f.events.map(ev => ev.id === eventId ? {
          ...ev,
          gender: category.gender || "ALL",
          minAge: category.minAge != null ? String(category.minAge) : "10",
          maxAge: category.maxAge != null ? String(category.maxAge) : "70",
        } : ev),
      };
    }));
  };

  const handleSportEdit = (e: any) => {
    const resolvedFormats = Array.isArray(e.format)
      ? e.format
      : (typeof e.format === "string" ? e.format.split(",") : ["SINGLES"]);
    const isTeam = resolvedFormats.includes("TEAM");
    
    const evId = Math.random().toString(36).substring(2);
    const firstCatId = e.categories && e.categories.length > 0 
      ? String(e.categories[0].id) 
      : (e.categoryIds && e.categoryIds.length > 0 ? String(e.categoryIds[0]) : "");

    if (firstCatId) {
      setSelectedTemplates(prev => ({ ...prev, [evId]: firstCatId }));
    }

    const editEntry: SportFormEntry = {
      id: Math.random().toString(36).substring(2),
      name: e.sport?.name || e.name,
      icon: e.sport?.icon || e.icon || "🏆",
      iconUrl: e.sport?.iconUrl || e.iconUrl || undefined,
      sportId: e.sport?.id || 1,
      editingSportId: e.id,
      events: [{
        id: evId,
        eventName: e.name.includes(" — ") ? e.name.split(" — ")[1] : e.name,
        startDate: e.eventDateStart || "",
        endDate: e.eventDateEnd || "",
        gender: e.gender || "ALL",
        playersBorn: e.playersBorn || "1900-01-01",
        format: Array.isArray(e.format) ? e.format.join(",") : (e.format || ""),
        formats: resolvedFormats,
        minPlayers: e.minPlayers != null ? String(e.minPlayers) : "",
        maxPlayers: e.maxPlayers != null ? String(e.maxPlayers) : "",
        minAge: e.minAge != null ? String(e.minAge) : "10",
        maxAge: e.maxAge != null ? String(e.maxAge) : "70",
        tournamentType: e.tournamentType || "",
        venueId: e.venue?.id ?? "",
        contactName: e.contactName || "",
        contactNumber: e.contactNumber || "",
        contactEmail: e.contactEmail || "",
        otherContacts: parseOtherContacts(e.otherContacts),
        auctionEnabled: !!e.auctionEnabled,
        adminApprovalRequired: e.adminApprovalRequired !== false,
      }],
    };
    setSportForms([editEntry]);
    setShowSportForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSportDelete = async (id: number) => {
    const confirmed = await confirmAction(
      "Cancel Event",
      "Are you sure you want to delete/cancel this scheduled event?"
    );
    if (!confirmed) return;
    try {
      await sportsService.deleteTournament(id);
      toast.success("Event deleted successfully");
      refreshEvents();
    } catch {
      toast.error("Failed to delete event");
    }
  };

  const handleSportSave = async () => {
    // Validate all forms
    for (const form of sportForms) {
      for (const ev of form.events) {
        if (!ev.eventName.trim()) { toast.error("Event Name is required"); return; }
        if (!ev.startDate || !ev.endDate) { toast.error("Start Date and End Date are required"); return; }
        if (!ev.tournamentType) { toast.error("Tournament Format is required"); return; }
        if (isTeamSport(form.name)) {
          if (!ev.minPlayers || parseInt(ev.minPlayers) <= 0) { toast.error("Min Players is required"); return; }
          if (!ev.maxPlayers || parseInt(ev.maxPlayers) <= 0) { toast.error("Max Players is required"); return; }
          if (parseInt(ev.maxPlayers) < parseInt(ev.minPlayers)) { toast.error("Max Players must be >= Min Players"); return; }
        } else {
          if (!ev.formats || ev.formats.length === 0) { toast.error("Participant Type is required"); return; }
        }
        if (!ev.contactName?.trim()) { toast.error("Contact Name is required"); return; }
        if (!ev.contactNumber?.trim()) { toast.error("Contact Number is required"); return; }
        if (!ev.contactEmail?.trim()) { toast.error("Contact Email is required"); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ev.contactEmail.trim())) {
          toast.error("Please enter a valid Contact Email");
          return;
        }
      }
    }

    setSportSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const form of sportForms) {
      const isTeam = isTeamSport(form.name);

      for (let eIdx = 0; eIdx < form.events.length; eIdx++) {
        const ev = form.events[eIdx];
        const payload: SportsEventRequest = {
          name: `${form.name} — ${ev.eventName}`,
          sportId: form.sportId,
          communityId: Number(activeCommId) || 1,
          eventDateStart: ev.startDate,
          eventDateEnd: ev.endDate,
          venueId: ev.venueId ? Number(ev.venueId) : undefined,
          minAge: parseInt(ev.minAge) || 10,
          maxAge: parseInt(ev.maxAge) || 70,
          minPlayers: isTeam ? parseInt(ev.minPlayers) : undefined,
          maxPlayers: isTeam ? parseInt(ev.maxPlayers) : undefined,
          gender: ev.gender || "ALL",
          playersBorn: ev.playersBorn || "1900-01-01",
          format: isTeam ? "TEAM" : (ev.formats && ev.formats.length > 0 ? ev.formats.join(",") : "SINGLES"),
          tournamentType: ev.tournamentType || "KNOCKOUT",
          categoryIds: selectedTemplates[ev.id] ? [Number(selectedTemplates[ev.id])] : undefined,
          contactName: ev.contactName?.trim() || "",
          contactNumber: ev.contactNumber?.trim() || "",
          contactEmail: ev.contactEmail?.trim() || "",
          otherContacts: JSON.stringify(
            (ev.otherContacts || []).filter(c => c.title.trim() || c.name.trim() || c.detail.trim())
          ) as any,
          // Auction only applies to team sports (intent flag; actual auction
          // config is created later on the Auction screen).
          auctionEnabled: isTeam ? !!ev.auctionEnabled : false,
          adminApprovalRequired: ev.adminApprovalRequired !== false,
        };

        try {
          if (form.editingSportId && eIdx === 0) {
            await sportsService.updateSportsEvent(form.editingSportId, payload);
            toast.success(`Event "${payload.name}" updated successfully!`);
          } else {
            await sportsService.createSportsEvent(payload);
            toast.success(`Event "${payload.name}" created successfully!`);
          }
          successCount++;
        } catch (err) {
          console.error(`Save event error:`, err);
          toast.error(err instanceof Error ? err.message : `Failed to save ${payload.name}`);
          failCount++;
        }
      }
    }

    if (successCount > 0) {
      refreshEvents();
    }
    if (failCount === 0) {
      resetSportForm();
    }
    setSportSubmitting(false);
  };

  // ─── Derived data ──────────────────────────────────────────────────
  const draftEvents = activeTournaments.filter(e => (e.event?.registrationStatus || e.registrationStatus) === "DRAFT");
  const liveEvents = activeTournaments.filter(e => {
    const status = e.event?.registrationStatus || e.registrationStatus;
    return status !== "DRAFT" && status !== "COMPLETED";
  });
  const completedEvents = activeTournaments.filter(e => (e.event?.registrationStatus || e.registrationStatus) === "COMPLETED");

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const activeCommId = isSuperAdmin ? (selectedCommId ? Number(selectedCommId) : undefined) : user?.communityId;
  const selectedComm = communities.find(c => c.id === activeCommId);
  const isGeneralCommunity = selectedComm
    ? (selectedComm.type === "GENERAL" || selectedComm.name.toLowerCase() === "general")
    : ((user as any)?.community?.type === "GENERAL" || (user as any)?.community?.name?.toLowerCase() === "general");

  // ─── Sidebar menu items ───────────────────────────────────────────
  const menuItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "sports-event", label: "Sports Event", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "teams", label: "Teams", icon: <Users className="w-4 h-4" /> },
    { id: "schedule", label: "Schedule", icon: <CalendarIcon className="w-4 h-4" /> },
    { id: "create-venue", label: "Venues", icon: <MapPin className="w-4 h-4" /> },
    { id: "player-category", label: "Player Category", icon: <Users className="w-4 h-4" /> },
    { id: "results", label: "Results", icon: <Trophy className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  if (isAdmin) {
    menuItems.push({ id: "sports-meta", label: "Sports Meta", icon: <Trophy className="w-4 h-4" /> });
  }

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="auction-hub-wrapper">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-title">Admin Hub</div>
        </div>
        <div className="nav-section">
          <div className="nav-label">Management</div>
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="nav-dot"></div>
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      <main className="main-content">
        <div className="page active">
          {activeTab !== "dashboard" && (
            <div className="page-hdr">
              <div>
                <div className="page-title">
                  {menuItems.find(m => m.id === activeTab)?.label || "Admin"}
                </div>
                <div className="page-sub">Manage community sports events and rules</div>
              </div>
            </div>
          )}

        {/* ════════════ OVERVIEW / DASHBOARD TAB ════════════ */}
        {activeTab === "dashboard" && (
          <DashboardTab
            activeTournaments={activeTournaments}
            teamsList={teamsList}
            pendingList={pendingList}
            venues={venues}
            activeEvents={activeEvents}
            approveTeam={approveTeam}
            setActiveTab={setActiveTab}
          />
        )}

        {/* ════════════ SPORTS EVENT / TOURNAMENTS TAB ════════════ */}
        {activeTab === "sports-event" && (
          <SportsEventTab
            user={user}
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
            activeCommId={activeCommId}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            draftEvents={draftEvents}
            liveEvents={liveEvents}
            completedEvents={completedEvents}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleActivate={handleActivate}
            handleViewPlayers={handleViewPlayers}
            handleViewCaptains={handleViewCaptains}
            viewingEventId={viewingEventId}
            viewMode={viewMode}
            registrations={registrations}
            nominatedCaptains={nominatedCaptains}
            loadingRegs={loadingRegs}
            handleConfirmRegistration={handleConfirmRegistration}
            handleRejectRegistration={handleRejectRegistration}
            handleConfirmCaptain={handleConfirmCaptain}
            setSelectedEventIdForAdd={setSelectedEventIdForAdd}
            setShowAddPlayerModal={setShowAddPlayerModal}
            setSelectedEventIdForImport={setSelectedEventIdForImport}
            setShowImportModal={setShowImportModal}
            setImportStep={setImportStep}
            showSportForm={showSportForm}
            setShowSportForm={setShowSportForm}
            showSportPicker={showSportPicker}
            setShowSportPicker={setShowSportPicker}
            sportPickerSearch={sportPickerSearch}
            setSportPickerSearch={setSportPickerSearch}
            sportSubmitting={sportSubmitting}
            sportForms={sportForms}
            sportsMeta={sportsMeta}
            playerCategories={playerCategories}
            venues={venues}
            activeEvents={activeEvents}
            handleSportPickerSelect={handleSportPickerSelect}
            handleCreateCustomSport={handleCreateCustomSport}
            removeSportForm={removeSportForm}
            addEventToSportForm={addEventToSportForm}
            removeEventFromSportForm={removeEventFromSportForm}
            updateSportFormEvent={updateSportFormEvent}
            handleSportSave={handleSportSave}
            handleSportEdit={handleSportEdit}
            handleSportDelete={handleSportDelete}
            resetSportForm={resetSportForm}
            selectedTemplates={selectedTemplates}
            setSelectedTemplates={setSelectedTemplates}
            openDropdownEventId={openDropdownEventId}
            setOpenDropdownEventId={setOpenDropdownEventId}
            searchQueries={searchQueries}
            setSearchQueries={setSearchQueries}
          />
        )}

        {/* ════════════ CREATE TOURNAMENT TAB ════════════ */}
        {activeTab === "create-tournament" && (
          <CreateTournamentTab
            user={user}
            editingEventId={editingEventId}
            eventName={eventName}
            setEventName={setEventName}
            selectedCommId={selectedCommId}
            setSelectedCommId={setSelectedCommId}
            maxPax={maxPax}
            setMaxPax={setMaxPax}
            description={description}
            setDescription={setDescription}
            communities={communities}
            activeEvents={activeEvents}
            selectedEventIds={selectedEventIds}
            toggleSportsEvent={toggleSportsEvent}
            setConfiguringSportId={setConfiguringSportId}
            setShowSportConfigModal={setShowSportConfigModal}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            regStartDate={regStartDate}
            setRegStartDate={setRegStartDate}
            regEndDate={regEndDate}
            setRegEndDate={setRegEndDate}
            startTime={startTime}
            setStartTime={setStartTime}
            dueTime={dueTime}
            setDueTime={setDueTime}
            tournamentLevel={tournamentLevel}
            setTournamentLevel={setTournamentLevel}
            bannerImage={bannerImage}
            setBannerImage={setBannerImage}
            handleBannerUpload={handleBannerUpload}
            eventContactName={eventContactName}
            setEventContactName={setEventContactName}
            eventContactNumber={eventContactNumber}
            setEventContactNumber={setEventContactNumber}
            eventContactEmail={eventContactEmail}
            setEventContactEmail={setEventContactEmail}
            otherContacts={otherContacts}
            addOtherContact={addOtherContact}
            removeOtherContact={removeOtherContact}
            updateOtherContact={updateOtherContact}
            sponsors={sponsors}
            addSponsor={addSponsor}
            removeSponsor={removeSponsor}
            updateSponsor={updateSponsor}
            allowAdminChat={allowAdminChat}
            totalEnabledCount={totalEnabledCount}
            globalChannels={globalChannels}
            customTriggers={customTriggers}
            totalOutputSends={totalOutputSends}
            setShowNotificationModal={setShowNotificationModal}
            submitting={submitting}
            handleSave={handleSave}
            resetForm={resetForm}
            setActiveTab={setActiveTab}
          />
        )}

        {/* ════════════ TEAMS MANAGEMENT TAB ════════════ */}
        {activeTab === "teams" && (
          <TeamsTab
            activeTournaments={activeTournaments}
            activeEvents={activeEvents}
            communityId={user?.role !== "SUPER_ADMIN" ? user?.communityId : null}
            isSuperAdmin={user?.role === "SUPER_ADMIN"}
          />
        )}

        {/* ════════════ SCHEDULE TAB ════════════ */}
        {activeTab === "schedule" && <ScheduleTab />}

        {/* ════════════ RESULTS TAB ════════════ */}
        {activeTab === "results" && <ResultsTab />}

        {/* ════════════ LEAGUE SETTINGS TAB ════════════ */}
        {activeTab === "settings" && <SettingsTab />}

        {/* ════════════ VENUE MANAGEMENT TAB ════════════ */}
        {activeTab === "create-venue" && (
          <VenueCreationSection
            user={user}
            communities={communities}
            venueCommunities={venueCommunities}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showVenueForm={showVenueForm}
            setShowVenueForm={setShowVenueForm}
            editingVenueId={editingVenueId}
            venueName={venueName}
            setVenueName={setVenueName}
            venueType={venueType}
            setVenueType={setVenueType}
            venueCommId={venueCommId}
            setVenueCommId={setVenueCommId}
            venueAddress={venueAddress}
            setVenueAddress={setVenueAddress}
            venueCity={venueCity}
            setVenueCity={setVenueCity}
            venueArea={venueArea}
            setVenueArea={setVenueArea}
            venueCapacity={venueCapacity}
            setVenueCapacity={setVenueCapacity}
            venuePinCode={venuePinCode}
            setVenuePinCode={setVenuePinCode}
            venueMapLink={venueMapLink}
            setVenueMapLink={setVenueMapLink}
            venueOpeningTime={venueOpeningTime}
            setVenueOpeningTime={setVenueOpeningTime}
            venueClosingTime={venueClosingTime}
            setVenueClosingTime={setVenueClosingTime}
            venueContacts={venueContacts}
            addVenueContact={addVenueContact}
            removeVenueContact={removeVenueContact}
            updateVenueContact={updateVenueContact}
            courts={courts}
            addCourt={addCourt}
            removeCourt={removeCourt}
            updateCourt={updateCourt}
            venueSubmitting={venueSubmitting}
            resetVenueForm={resetVenueForm}
            handleVenueSave={handleVenueSave}
            venues={venues}
            hiddenVenues={hiddenVenues}
            handleVenueEdit={handleVenueEdit}
            handleVenueHide={handleVenueHide}
            handleVenueDelete={handleVenueDelete}
            refreshVenues={refreshVenues}
          />
        )}

        {/* ════════════ PLAYER CATEGORY TAB ════════════ */}
        {activeTab === "player-category" && (
          <PlayerCategorySection
            user={user}
            communities={communities}
            playerCategories={playerCategories}
            showCategoryForm={showCategoryForm}
            setShowCategoryForm={setShowCategoryForm}
            editingCategoryId={editingCategoryId}
            categoryName={categoryName}
            setCategoryName={setCategoryName}
            categoryType={categoryType}
            setCategoryType={setCategoryType}
            categoryGender={categoryGender}
            setCategoryGender={setCategoryGender}
            categoryMinAge={categoryMinAge}
            setCategoryMinAge={setCategoryMinAge}
            categoryMaxAge={categoryMaxAge}
            setCategoryMaxAge={setCategoryMaxAge}
            categoryCommId={categoryCommId}
            setCategoryCommId={setCategoryCommId}
            categoryDescription={categoryDescription}
            setCategoryDescription={setCategoryDescription}
            categorySubmitting={categorySubmitting}
            resetCategoryForm={resetCategoryForm}
            handleCategorySave={handleCategorySave}
            handleCategoryEdit={handleCategoryEdit}
            handleCategoryDelete={handleCategoryDelete}
            setActiveTab={setActiveTab}
          />
        )}

        {/* ════════════ SPORTS META TAB ════════════ */}
        {activeTab === "sports-meta" && isAdmin && (
          <SportsMetaSection isAdmin={isAdmin} />
        )}

        </div>
      </main>


      {/* ── Notification Setup Popup Modal ── */}
      <NotificationSetupModal
        showNotificationModal={showNotificationModal}
        setShowNotificationModal={setShowNotificationModal}
        triggerStates={triggerStates}
        setTriggerStates={setTriggerStates}
        customTriggers={customTriggers}
        setCustomTriggers={setCustomTriggers}
        globalChannels={globalChannels}
        setGlobalChannels={setGlobalChannels}
        expandedTrigger={expandedTrigger}
        setExpandedTrigger={setExpandedTrigger}
        previewTrigger={previewTrigger}
        setPreviewTrigger={setPreviewTrigger}
        eventName={eventName}
        startTime={startTime}
        regStartDate={regStartDate}
        selectedVenueDetails={selectedVenueDetails}
        allTriggersToRender={allTriggersToRender}
        getCompiledPreviewBody={getCompiledPreviewBody}
        currentActiveChannels={currentActiveChannels}
        previewCount={previewCount}
        previewPercentage={previewPercentage}
        totalEnabledCount={totalEnabledCount}
        totalOutputSends={totalOutputSends}
        toggleGlobalChannel={toggleGlobalChannel}
        toggleTriggerRow={toggleTriggerRow}
        handleTriggerFieldChange={handleTriggerFieldChange}
        toggleRecipient={toggleRecipient}
        toggleTriggerChannel={toggleTriggerChannel}
        addCustomTrigger={addCustomTrigger}
        removeCustomTrigger={removeCustomTrigger}
        getTournamentStartDateTime={getTournamentStartDateTime}
        formatINRDate={formatINRDate}
      />

      {/* ── Manual Add Player Modal ── */}
      <AddPlayerModal
        showAddPlayerModal={showAddPlayerModal}
        setShowAddPlayerModal={setShowAddPlayerModal}
        addPlayerForms={addPlayerForms}
        setAddPlayerForms={setAddPlayerForms}
        communityUsers={communityUsers}
        loadingUsers={loadingUsers}
        friendSearchQuery={friendSearchQuery}
        setFriendSearchQuery={setFriendSearchQuery}
        filteredFriends={filteredFriends}
        handleSelectFriend={handleSelectFriend}
        handleAddNewPlayerCard={handleAddNewPlayerCard}
        handleDeletePlayerCard={handleDeletePlayerCard}
        handleAddPlayerSubmit={handleAddPlayerSubmit}
        submitting={submitting}
        playerCategories={playerCategories}
        formatDob={formatDob}
      />

      {/* ── CSV Import Participants Modal ── */}
      <ImportPlayersModal
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        csvFile={csvFile}
        parsedRows={parsedRows}
        parsingError={parsingError}
        importing={importing}
        importProgress={importProgress}
        handleDownloadSample={handleDownloadSample}
        handleFileChange={handleFileChange}
        handleImportSubmit={handleImportSubmit}
        setCsvFile={setCsvFile}
        setParsedRows={setParsedRows}
      />

      {/* ── Sport Event Configuration Popup Modal ── */}
      <SportEventConfigModal
        isOpen={showSportConfigModal}
        onClose={() => {
          setShowSportConfigModal(false);
          setConfiguringSportId(null);
        }}
        configuringSportId={configuringSportId}
        selectedSportsWithEvents={selectedSportsWithEvents}
        addEventToSport={addEventToSport}
        removeEvent={removeEvent}
        updateEventField={updateEventField}
        playerCategories={playerCategories}
      />

      {/* ── Selected Venue Details Popup Modal ── */}
      <VenueDetailsModal
        isOpen={showVenueDetailsModal}
        onClose={() => setShowVenueDetailsModal(false)}
        selectedVenueDetails={selectedVenueDetails}
        loadingVenueDetails={loadingVenueDetails}
        onEditVenue={selectedVenueDetails ? () => {
          setVenueCommId(selectedVenueDetails.communityId || "");
          setVenueType(selectedVenueDetails.venueType || "");
          setActiveTab("create-venue");
          setShowVenueForm(true);
          setEditingVenueId(selectedVenueDetails.id);
        } : undefined}
      />

      {/* ── Open for Registration Notification Modal ── */}
      {activatingTournament && (
        <RegistrationOpenModal
          tournament={activatingTournament}
          onConfirm={handleConfirmActivate}
          onClose={() => setActivatingTournament(null)}
        />
      )}
    </div>
  );
}

