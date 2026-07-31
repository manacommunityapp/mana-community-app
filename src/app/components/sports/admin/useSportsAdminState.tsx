import { useState, useEffect, useCallback, useRef } from "react";
import { LayoutDashboard, CalendarIcon, MapPin, Users, Trophy, Settings, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { showSuccess, showWarning, showError, showInfo } from "../../../../utils/ToastUtils";
import { confirmAction } from "../../../../utils/AlertUtils";
import { sportsService } from "../../../../services/sportsService";
import { sportsAdminService } from "../../../../services/sportsAdminService";
import { venueService } from "../../../../services/venueService";
import { communityService } from "../../../../services/communityService";
import { auctionService } from "../../../../services/auctionService";
import { userService } from "../../../../services/userService";
import { notificationService } from "../../../../services/notificationService";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  CREATE_EDIT_SPORTS_MAIN,
  CREATE_EDIT_PLAYER_POOL,
  CREATE_EDIT_EVENT_REGISTRATIONS,
  DELETE_SPORTS_MAIN,
} from "../../../../constants/permissions";
import type { Venue, SportMeta, PlayerCategory, CommunityResponse, AuctionTeam, Court, EventRegistration, MatchFormat, SportsEventRequest, SportFormEvent, SportFormEntry, EventContact } from "../../../../types/api";
import { ClipboardList } from "lucide-react";
import { isTeamSport, getDefaultMinPlayers, PREDEFINED_SPORTS, BasketballIcon, SPORT_ICONS, SPORT_COLORS, DEFAULT_AVATAR_URL } from "../utils/sportsConstants";
import type { RegistrationNotifConfig } from "./RegistrationOpenModal";
import type { AnnouncementConfig } from "./TournamentAnnouncementModal";

const toast = {
  success: (msg: string) => showSuccess(msg),
  warning: (msg: string) => showWarning(msg),
  error: (msg: string) => showError(msg),
  info: (msg: string) => showInfo(msg),
};

export const DEFAULT_TRIGGERS = {
  "7d":  { id: "7d",  label: "7 Days Before",       offset: -7 * 24 * 60, color: "border-blue-500",   bgColor: "rgba(59,130,246,0.15)",   textColor: "text-blue-400",   emoji: "📅", tagClass: "bg-blue-500/15 text-blue-400 border border-blue-500/20", category: "Registration", priority: "Critical" },
  "1d":  { id: "1d",  label: "1 Day Before",         offset: -1 * 24 * 60, color: "border-amber-500",  bgColor: "rgba(245,158,11,0.15)",   textColor: "text-amber-400",  emoji: "🌅", tagClass: "bg-amber-500/15 text-amber-400 border border-amber-500/20", category: "Reminder",   priority: "Critical" },
  "2h":  { id: "2h",  label: "2 Hours Before",       offset: -120,         color: "border-emerald-500",bgColor: "rgba(16,185,129,0.15)",  textColor: "text-emerald-400", emoji: "⚡", tagClass: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", category: "Urgent",   priority: "High" },
  "30m": { id: "30m", label: "30 Minutes Before",    offset: -30,          color: "border-rose-500",   bgColor: "rgba(244,63,94,0.15)",   textColor: "text-rose-400",   emoji: "🔴", tagClass: "bg-rose-500/15 text-rose-400 border border-rose-500/20", category: "Critical",   priority: "Critical" },
  "now": { id: "now", label: "At Tournament Start",  offset: 0,            color: "border-yellow-400", bgColor: "rgba(245,158,11,0.2)",    textColor: "text-yellow-400",  emoji: "🏁", tagClass: "bg-amber-500/15 text-amber-500 border border-amber-500/20", category: "Live",       priority: "Normal" }
} as const;

export const CHANNEL_META = [
  { id: "push",     emoji: "📲", label: "Push" },
  { id: "email",    emoji: "✉️", label: "Email" },
  { id: "sms",      emoji: "💬", label: "SMS" },
  { id: "whatsapp", emoji: "🟢", label: "WhatsApp" },
  { id: "inapp",    emoji: "🔔", label: "In-App" }
] as const;

export const CUSTOM_OFFSET_OPTIONS = [
  { offset: -15, label: "15 minutes before" },
  { offset: -45, label: "45 minutes before" },
  { offset: -180, label: "3 hours before" },
  { offset: -360, label: "6 hours before" },
  { offset: -2880, label: "2 days before" },
  { offset: -4320, label: "3 days before" },
  { offset: 30, label: "After match ends" }
] as const;

export const RECIPIENT_OPTIONS = [
  "Registered Players",
  "Team Owners",
  "All Members",
  "Admins Only",
  "Spectators",
  "Referees"
] as const;

export type TabId = "sports-event" | "teams" | "schedule" | "create-venue" | "player-category" | "results" | "settings" | "sports-meta" | "create-tournament" | "dashboard" | "notification-analytics";

export interface SportEventState {
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

export interface SelectedSportWithEvents {
  sportId: number;
  sportName: string;
  sportIcon?: string;
  sportIconUrl?: string;
  events: SportEventState[];
}

export { isTeamSport, getDefaultMinPlayers, PREDEFINED_SPORTS, BasketballIcon, SPORT_ICONS as sportIconMap, SPORT_COLORS as sportColorMap } from "../utils/sportsConstants";

const DEFAULT_TRIGGER_STATES = {
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
};

const createDefaultPlayerForm = (categoryId?: string) => ({
  id: Math.random().toString(),
  playerName: "",
  playerEmail: "",
  categoryId: categoryId || "",
  avatarUrl: DEFAULT_AVATAR_URL,
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
});

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

export function useSportsAdminState() {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const isAdmin = hasAnyPermission(CREATE_EDIT_SPORTS_MAIN, CREATE_EDIT_PLAYER_POOL, CREATE_EDIT_EVENT_REGISTRATIONS, DELETE_SPORTS_MAIN);
  const [sportsMeta, setSportsMeta] = useState<SportMeta[]>([]);
  const [playerCategories, setPlayerCategories] = useState<PlayerCategory[]>([]);
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);

  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, string>>({});
  const [openDropdownEventId, setOpenDropdownEventId] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  const [selectedSports, setSelectedSports] = useState<number[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const [selectedSportsWithEvents, setSelectedSportsWithEvents] = useState<SelectedSportWithEvents[]>([]);
  const [selectedCats, setSelectedCats] = useState<number[]>([]);
  const [selectedCommId, setSelectedCommId] = useState<number | "">("");

  const [eventName, setEventName] = useState("");
  const [maxPax, setMaxPax] = useState("");

  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | "">("");
  const [selectedVenueDetails, setSelectedVenueDetails] = useState<Venue | null>(null);
  const [loadingVenueDetails, setLoadingVenueDetails] = useState(false);
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [activeTournaments, setActiveTournaments] = useState<any[]>([]);
  const [activatingTournament, setActivatingTournament] = useState<{ id: number; name: string } | null>(null);
  const [announcingTournament, setAnnouncingTournament] = useState<{ id: number; name: string } | null>(null);
  const [activeTournamentId, setActiveTournamentId] = useState<number | null>(null);
  const [activeTournamentName, setActiveTournamentName] = useState<string>("");

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [regStartDate, setRegStartDate] = useState<Date>();
  const [regEndDate, setRegEndDate] = useState<Date>();

  const [eventContactName, setEventContactName] = useState("");
  const [eventContactNumber, setEventContactNumber] = useState("");
  const [eventContactEmail, setEventContactEmail] = useState("");
  const [otherContacts, setOtherContacts] = useState<{ title: string; name: string; detail: string; }[]>([]);
  const [sponsors, setSponsors] = useState<{ category: string; name: string; url: string; }[]>([]);
  const [bannerImage, setBannerImage] = useState("");
  const [tournamentLevel, setTournamentLevel] = useState<"Standard" | "Professional" | "Premium">("Standard");
  const [description, setDescription] = useState("");
  const [allowAdminChat, setAllowAdminChat] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [dueTime, setDueTime] = useState("");

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
  }>>(DEFAULT_TRIGGER_STATES);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const activeCommId = isSuperAdmin ? (selectedCommId ? Number(selectedCommId) : undefined) : user?.communityId;

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
          if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
          else if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
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
      offset: -15,
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
    if (previewTrigger === id) setPreviewTrigger("2h");
    if (expandedTrigger === id) setExpandedTrigger(null);
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
  // The Tournament record's own id (used for the update URL) and the ids of the
  // sports events currently linked to it (preserved on update so editing the
  // tournament doesn't unlink its events).
  const [editingTournamentId, setEditingTournamentId] = useState<number | null>(null);
  const [editingLinkedEventIds, setEditingLinkedEventIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [teamsList, setTeamsList] = useState<any[]>([]);
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [adminSearchQuery, setAdminSearchQuery] = useState("");

  const refreshDashboardOverview = useCallback(async () => {
    try {
      const data = await sportsAdminService.getOverview(activeCommId);
      const pendingMapped = (data.pendingRegistrations || []).map((reg) => ({
        id: reg.id,
        teamName: reg.proposedTeamName || reg.playerName || `Registration #${reg.id}`,
        sport: reg.event?.sport?.name || reg.event?.name || "General",
        captain: reg.playerName || reg.user?.fullName || "—",
        email: reg.email || reg.user?.email || "—",
        members: 1,
        date: reg.registeredAt ? format(new Date(reg.registeredAt), "MMM d") : ""
      }));
      setPendingList(pendingMapped);
      const confirmedMapped = (data.confirmedRegistrations || []).map((reg) => ({
        id: reg.id,
        name: reg.proposedTeamName || reg.playerName || `Registration #${reg.id}`,
        sport: reg.event?.sport?.name || reg.event?.name || "General",
        division: "Competitive",
        captain: reg.playerName || reg.user?.fullName || "—",
        members: 1,
        status: "active" as const,
        record: "—"
      }));
      setTeamsList(confirmedMapped);
    } catch (err) {
      console.error("Failed to load dashboard overview data", err);
    }
  }, [activeCommId]);

  useEffect(() => {
    if (activeTab === "dashboard") {
      refreshDashboardOverview();
    }
  }, [activeTab, refreshDashboardOverview]);

  const approveTeam = async (id: number) => {
    try {
      await sportsService.confirmRegistration(id);
      toast.success("Registration approved successfully!");
      refreshDashboardOverview();
    } catch {
      toast.error("Failed to approve registration");
    }
  };

  const rejectTeam = async (id: number) => {
    const ok = await confirmAction("Reject Registration", "Are you sure you want to reject this registration?");
    if (!ok) return;
    try {
      await sportsService.rejectRegistration(id);
      toast.success("Registration rejected");
      refreshDashboardOverview();
    } catch {
      toast.error("Failed to reject registration");
    }
  };

  const hydratedTabs = useRef(new Set<TabId>());
  const tournamentsFetchedRef = useRef(false);
  const eventsFetchedRef = useRef(false);

  // Sports Event form state
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

  // Venue form state
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
  const [venueCommId, setVenueCommId] = useState<number | "">("");
  const [venueCommunities, setVenueCommunities] = useState<CommunityResponse[]>([]);
  const [venueSubmitting, setVenueSubmitting] = useState(false);
  const [hiddenVenues, setHiddenVenues] = useState<Set<number>>(new Set());

  // Courts & Contact Info states
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

  // Player Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryMinAge, setCategoryMinAge] = useState("");
  const [categoryMaxAge, setCategoryMaxAge] = useState("");
  const [categoryGender, setCategoryGender] = useState("");
  const [categoryCommId, setCategoryCommId] = useState<number | "">("");
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // Registration viewing state
  const [viewingEventId, setViewingEventId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"players" | "captains">("players");
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [nominatedCaptains, setNominatedCaptains] = useState<AuctionTeam[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // Manual Add Participant Modal State
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
  }>>([createDefaultPlayerForm(playerCategories[0]?.id ? String(playerCategories[0].id) : "")]);

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
      if (force !== true && lastFetchedVenueCommIdRef.current === fetchId) return;
      lastFetchedVenueCommIdRef.current = fetchId;
      venueService.getVenues(fetchId).then(setVenues).catch(() => { /* data fetch fallback */ });
    }
  }, [selectedCommId, user?.communityId, user?.role, communities, (user as any)?.community]);

  useEffect(() => {
    if (showAddPlayerModal) {
      const commId = user?.communityId || selectedCommId;
      if (commId) {
        setLoadingUsers(true);
        userService.getCommunityUsers(Number(commId))
          .then(res => setCommunityUsers(res || []))
          .catch(err => console.error("Failed to load community users", err))
          .finally(() => setLoadingUsers(false));
      }
    }
  }, [showAddPlayerModal, user?.communityId, selectedCommId]);

  const handleSelectFriend = (friend: any) => {
    setAddPlayerForms(prev => {
      if (prev.some(p => p.playerEmail === friend.email || p.playerName === friend.fullName)) {
        toast.warning("Player is already in the list");
        return prev;
      }
      const newCard = {
        id: Math.random().toString(),
        playerName: friend.fullName,
        playerEmail: friend.email || "",
        categoryId: playerCategories[0]?.id ? String(playerCategories[0].id) : "",
        avatarUrl: friend.avatarUrl || DEFAULT_AVATAR_URL,
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
      if (prev.length === 1 && !prev[0].playerName.trim() && !prev[0].playerEmail.trim()) {
        return [newCard];
      }
      return [...prev, newCard];
    });
    toast.success(`Selected ${friend.fullName}`);
  };

  const handleAddNewPlayerCard = () => {
    setAddPlayerForms(prev => [...prev, createDefaultPlayerForm(playerCategories[0]?.id ? String(playerCategories[0].id) : "")]);
  };

  const handleDeletePlayerCard = (cardId: string) => {
    setAddPlayerForms(prev => {
      const updated = prev.filter(c => c.id !== cardId);
      if (updated.length === 0) {
        return [createDefaultPlayerForm(playerCategories[0]?.id ? String(playerCategories[0].id) : "")];
      }
      return updated;
    });
  };

  const formatDob = (dobString?: string) => {
    if (!dobString) return "";
    try {
      return format(new Date(dobString), "MMM d, yyyy");
    } catch {
      return dobString;
    }
  };

  const filteredFriends = communityUsers.filter(u =>
    u.fullName.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(friendSearchQuery.toLowerCase()))
  );

  const handleAddPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventIdForAdd) return;
    for (let idx = 0; idx < addPlayerForms.length; idx++) {
      const form = addPlayerForms[idx];
      if (!form.playerName.trim()) { toast.error(`Player Name is required for card #${idx + 1}`); return; }
      if (!form.playerEmail.trim()) { toast.error(`Player Email is required for card #${idx + 1}`); return; }
      if (!form.categoryId) { toast.error(`Player Category is required for card #${idx + 1}`); return; }
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
      if (successCount > 0) toast.success(`Successfully registered ${successCount} participant(s)!`);
      if (failCount > 0) toast.error(`Failed to register ${failCount} participant(s)`);
      setShowAddPlayerModal(false);
      setAddPlayerForms([createDefaultPlayerForm(playerCategories[0]?.id ? String(playerCategories[0].id) : "")]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setParsingError(null);
    import("papaparse").then((Papa) => {
      Papa.default.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) console.warn("CSV parsing warnings:", results.errors);
          setParsedRows(results.data);
        },
        error: (err) => {
          setParsingError("Failed to parse CSV file: " + err.message);
        }
      });
    });
    setImportStep(2);
  };

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
      const getVal = (aliases: string[]) => {
        for (const alias of aliases) {
          const key = Object.keys(row).find(k => k.toLowerCase().replace(/[\s_-]/g, '') === alias.toLowerCase().replace(/[\s_-]/g, ''));
          if (key && row[key] !== undefined) return String(row[key]).trim();
        }
        return "";
      };
      const name = getVal(["name", "playerName", "fullName", "player"]);
      if (!name) { failCount++; continue; }
      const email = getVal(["email", "emailId", "mail", "emailAddress"]);
      const categoryName = getVal(["category", "playerCategory", "class", "division"]);
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
    setShowImportModal(false);
    setCsvFile(null);
    setParsedRows([]);
    setImportProgress(null);
    setImporting(false);
    if (viewingEventId) {
      const regs = await sportsService.getTournamentRegistrations(viewingEventId);
      setRegistrations(regs);
    }
  };

  const refreshTournaments = useCallback(() => {
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const targetId = isSuperAdmin ? null : user?.communityId;
    if (isSuperAdmin) {
      sportsService.getAllTournaments().then(setActiveTournaments).catch(() => { /* data fetch fallback */ });
    } else if (targetId) {
      sportsService.getCommunityTournaments(targetId).then(setActiveTournaments).catch(() => { /* data fetch fallback */ });
    }
  }, [user?.role, user?.communityId]);

  const refreshEvents = useCallback(() => {
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const targetId = isSuperAdmin ? null : user?.communityId;
    if (isSuperAdmin) {
      sportsService.getAllEvents(true).then(setActiveEvents).catch(() => { /* data fetch fallback */ });
    } else if (targetId) {
      sportsService.getCommunityEvents(targetId, true).then(setActiveEvents).catch(() => { /* data fetch fallback */ });
    }
  }, [user?.role, user?.communityId]);

  const refreshCategories = useCallback(() => {
    sportsService.getCategories().then(setPlayerCategories).catch(() => { /* data fetch fallback */ });
  }, []);

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

  // Lazy loaders for the Sports Event sub-tabs — called when each sub-tab is opened.
  // Fetch fresh from the APIs each time (not the ...Once guards) so opening
  // Sports Event → Tournaments List always reloads the list data.
  const loadTournamentsListData = useCallback(() => {
    refreshEvents();
    refreshTournaments();
    eventsFetchedRef.current = true;
    tournamentsFetchedRef.current = true;
  }, [refreshEvents, refreshTournaments]);

  const loadConfigureEventsData = useCallback(() => {
    sportsService.getSportsMeta().then(setSportsMeta).catch(() => { /* data fetch fallback */ });
    sportsService.getCategories().then(setPlayerCategories).catch(() => { /* data fetch fallback */ });
    refreshVenues();
  }, [refreshVenues]);

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
        // Data is loaded lazily per sub-tab (see loadTournamentsListData /
        // loadConfigureEventsData, wired through SportsEventTab).
        break;
      case "teams":
        fetchTournamentsOnce();
        break;
      case "schedule":
        fetchTournamentsOnce();
        fetchEventsOnce();
        break;
      case "create-venue":
        communityService.getCommunities().then(setCommunities).catch(() => { /* data fetch fallback */ });
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
        sportsService.getSportsMeta().then(setSportsMeta).catch(() => { /* data fetch fallback */ });
        break;
      case "create-tournament":
        sportsService.getSportsMeta().then(setSportsMeta).catch(() => { /* data fetch fallback */ });
        sportsService.getCategories().then(setPlayerCategories).catch(() => { /* data fetch fallback */ });
        communityService.getCommunities().then(setCommunities).catch(() => { /* data fetch fallback */ });
        break;
      default:
        break;
    }
  }, [activeTab, fetchTournamentsOnce, fetchEventsOnce, refreshCategories, refreshVenues]);

  const venueTabsNeedFetch = activeTab === "dashboard" || activeTab === "create-venue" || activeTab === "create-tournament" || activeTab === "sports-event";
  const lastVenuesFetchRef = useRef<typeof refreshVenues | null>(null);
  useEffect(() => {
    if (!venueTabsNeedFetch) return;
    if (lastVenuesFetchRef.current !== refreshVenues) {
      lastVenuesFetchRef.current = refreshVenues;
      refreshVenues();
    }
  }, [refreshVenues, venueTabsNeedFetch]);

  useEffect(() => {
    if (activeTab === "create-venue" || activeTab === "create-tournament") {
      if (!selectedVenueId) {
        setSelectedVenueDetails(null);
        return;
      }
      setLoadingVenueDetails(true);
      venueService.getVenueById(Number(selectedVenueId))
        .then(res => setSelectedVenueDetails(res))
        .catch(err => {
          console.error("Failed to load venue details:", err);
          const localVenue = venues.find(v => v.id === Number(selectedVenueId));
          setSelectedVenueDetails(localVenue || null);
        })
        .finally(() => setLoadingVenueDetails(false));
    }
  }, [selectedVenueId, venues, activeTab]);

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
              return { ...item, events: item.events.filter(evt => evt.id !== e.id.toString()) };
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
                return { ...item, events: [...item.events, newEvent] };
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
      return { ...s, events: [...s.events, newEvent] };
    }));
  };

  const removeEvent = (sportId: number, eventId: string) => {
    setSelectedSportsWithEvents(prev => prev.map(s => {
      if (s.sportId !== sportId) return s;
      if (s.events.length <= 1) {
        toast.warning("A selected sport must have at least one event configuration.");
        return s;
      }
      return { ...s, events: s.events.filter(e => e.id !== eventId) };
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
    if (!startDate || !endDate) { toast.error("Dates are required"); return; }
    if (!eventContactName.trim()) { toast.error("Tournament Contact Name is required"); return; }
    if (!eventContactNumber.trim()) { toast.error("Tournament Contact Number is required"); return; }
    if (!eventContactEmail.trim()) { toast.error("Tournament Contact Email is required"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(eventContactEmail)) { toast.error("Please enter a valid Tournament Contact Email"); return; }
    for (let i = 0; i < sponsors.length; i++) {
      const s = sponsors[i];
      if (!s.category.trim()) { toast.error(`Sponsor Category is required for sponsor #${i + 1}`); return; }
      if (!s.name.trim()) { toast.error(`Sponsor Name is required for sponsor #${i + 1}`); return; }
    }
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const finalCommId = isSuperAdmin ? selectedCommId : user?.communityId;
    if (!finalCommId) { toast.error("Please select a community"); return; }

    const baseDate = getTournamentStartDateTime();
    const displayVenue = selectedVenueDetails?.name || "Sector 12 Ground, Block C";
    const displayStartDate = regStartDate ? format(regStartDate, "dd MMM yyyy") : "25 Nov 2026";
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
        if (!singleEvent) { toast.error("No event configuration found to save"); setSubmitting(false); return; }
        // Preserve the tournament's existing event links captured at edit time; fall
        // back to the form's configured events only if none were captured.
        const formEventIds = selectedSportsWithEvents.flatMap(s => s.events.map(e => e.eventId).filter(id => id != null).map(Number));
        const targetEventIds = editingLinkedEventIds.length ? editingLinkedEventIds : formEventIds;
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
        // Target the Tournament record by its own id (falls back to the event id for
        // safety); the backend updates it in place instead of inserting a duplicate.
        await sportsService.updateTournament(editingTournamentId ?? editingEventId, payload as any);
        toast.success("Tournament updated successfully!");
        // Offer the notifications-to-send step on update too (same as create), so
        // admins can announce the updated tournament details to members.
        const announceId = editingTournamentId ?? editingEventId;
        if (announceId) {
          setAnnouncingTournament({ id: announceId, name: singleEvent.name || eventName });
        }
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
        const created = await sportsService.createTournament(payload as any);
        toast.success("Tournament created! Now add sports events to it.");
        setAnnouncingTournament({ id: created.id, name: eventName });
        resetForm();
        setActiveTournamentId(created.id);
        setActiveTournamentName(eventName);
        hydratedTabs.current.delete("sports-event");
        setActiveTab("sports-event");
        return;
      }
      resetForm();
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
    setMaxPax("");
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
    setStartTime("");
    setDueTime("");
    setEditingEventId(null);
    setEditingTournamentId(null);
    setEditingLinkedEventIds([]);
    setSelectedEventIds([]);
    setGlobalChannels(["push", "email"]);
    setPreviewTrigger("2h");
    setExpandedTrigger(null);
    setCustomTriggers([]);
    setTriggerStates(DEFAULT_TRIGGER_STATES);
  };

  const clearTournamentContext = () => {
    setActiveTournamentId(null);
    setActiveTournamentName("");
  };

  const setTournamentContext = (id: number, name: string) => {
    setActiveTournamentId(id);
    setActiveTournamentName(name);
  };

  const handleEdit = (tournamentOrEvent: any) => {
    // Tournaments-List items are Tournament records: their own `id` is the tournament
    // id and their linked sports events live on `sportsEvents` (the API never sets a
    // singular `event`). Resolve the primary linked event so the form shows the sport,
    // and capture the tournament id + linked event ids so the update targets the right
    // record and preserves its event links (previously it duplicated the tournament).
    const linkedEvents: any[] = tournamentOrEvent.sportsEvents
      ?? (tournamentOrEvent.event ? [tournamentOrEvent.event] : []);
    const primaryEvent = linkedEvents[0] ?? tournamentOrEvent.event ?? null;
    setEditingTournamentId(tournamentOrEvent.id ?? null);
    setEditingLinkedEventIds(
      linkedEvents.map((e: any) => e?.id).filter((x: any) => x != null).map(Number)
    );
    const ev = {
      ...tournamentOrEvent,
      ...(primaryEvent || {}),
      id: primaryEvent?.id ?? tournamentOrEvent.id,
      name: tournamentOrEvent.name || primaryEvent?.name || "",
      registrationDateStart: tournamentOrEvent.registrationDateStart || primaryEvent?.registrationDateStart,
      registrationDateEnd: tournamentOrEvent.registrationDateEnd || primaryEvent?.registrationDateEnd,
      maxParticipants: tournamentOrEvent.maxParticipants ?? primaryEvent?.maxParticipants,
      description: tournamentOrEvent.description || primaryEvent?.description,
      eventDateStart: tournamentOrEvent.eventDateStart || primaryEvent?.eventDateStart,
      eventDateEnd: tournamentOrEvent.eventDateEnd || primaryEvent?.eventDateEnd,
      contactName: tournamentOrEvent.contactName || primaryEvent?.contactName,
      contactNumber: tournamentOrEvent.contactNumber || primaryEvent?.contactNumber,
      contactEmail: tournamentOrEvent.contactEmail || primaryEvent?.contactEmail,
      bannerImage: tournamentOrEvent.bannerImage || primaryEvent?.bannerImage,
      tournamentLevel: tournamentOrEvent.tournamentLevel || primaryEvent?.tournamentLevel,
      startTime: tournamentOrEvent.startTime || primaryEvent?.startTime,
      dueTime: tournamentOrEvent.dueTime || primaryEvent?.dueTime,
      tournamentId: tournamentOrEvent.id,
    };
    setEventName(ev.name || "");
    setSelectedVenueId(ev.venue?.id ?? "");
    setStartDate(ev.eventDateStart ? new Date(ev.eventDateStart) : undefined);
    setEndDate(ev.eventDateEnd ? new Date(ev.eventDateEnd) : undefined);
    setRegStartDate(ev.registrationDateStart ? new Date(ev.registrationDateStart) : undefined);
    setRegEndDate(ev.registrationDateEnd ? new Date(ev.registrationDateEnd) : undefined);
    setMaxPax(ev.maxParticipants != null ? String(ev.maxParticipants) : "");
    setDescription(ev.description || "");
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
    setAllowAdminChat(ev.allowAdminChat || false);
    setStartTime(ev.startTime || "");
    setDueTime(ev.dueTime || "");
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
    if (!tournament) return;

    // 1. Validation: Check if any sports events are configured
    const sportsEvents = tournament.sportsEvents || [];
    if (sportsEvents.length === 0) {
      toast.error("Cannot open for registration: No sports events are configured for this tournament. Please configure at least one event first.");
      return;
    }

    const eventObj = tournament.event || tournament;
    const regStartDateStr = eventObj.registrationDateStart;
    const regEndDateStr = eventObj.registrationDateEnd;

    // 2. Validation: Check if registration dates are configured
    if (!regStartDateStr || !regEndDateStr) {
      toast.error("Cannot open for registration: Registration start and end dates must be configured.");
      return;
    }

    const regStartDate = new Date(regStartDateStr);
    const regEndDate = new Date(regEndDateStr);
    const now = new Date();

    // 3. Validation: Check if registration end date has already passed
    if (regEndDate < now) {
      toast.error("Cannot open for registration: The registration end date has already passed. Please update the registration dates.");
      return;
    }

    // 4. Validation: Check if start date is after end date
    if (regEndDate < regStartDate) {
      toast.error("Cannot open for registration: The registration end date cannot be before the start date.");
      return;
    }

    const name = tournament.name || "Tournament";
    setActivatingTournament({ id, name });
  };

  const handleConfirmActivate = async (config: RegistrationNotifConfig) => {
    if (!activatingTournament) return;
    await sportsService.updateTournamentStatus(activatingTournament.id, "REGISTRATION_OPEN");
    setActivatingTournament(null);
    refreshTournaments();
    refreshEvents();
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

  const handleSendAnnouncement = async (config: AnnouncementConfig) => {
    if (!announcingTournament) return;
    try {
      await notificationService.sendTournamentAnnouncement(announcingTournament.id, {
        template: config.template,
        subject: config.subject,
        message: config.message,
        sendEmail: config.sendEmail,
        sendPush: config.sendPush,
        customHtml: config.customHtml ?? undefined,
      });
      toast.success("Announcement sent to community!");
    } catch {
      toast.error("Failed to send announcement.");
    } finally {
      setAnnouncingTournament(null);
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
    const { isConfirmed, value: reason } = await (await import("sweetalert2")).default.fire({
      title: "Reject Registration",
      input: "text",
      inputLabel: "Reason for rejection (optional)",
      showCancelButton: true,
      confirmButtonColor: "#2563EB",
      cancelButtonColor: "#EF4444",
      confirmButtonText: "Reject",
    });
    if (!isConfirmed) return;
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

  // Venue CRUD
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
    if (!venueContacts || venueContacts.length === 0) {
      toast.error("At least one contact is required"); return;
    }
    for (let i = 0; i < venueContacts.length; i++) {
      const c = venueContacts[i];
      if (!c.name?.trim()) { toast.error(`Contact #${i + 1} Name is required`); return; }
      if (!c.number?.trim()) { toast.error(`Contact #${i + 1} Number is required`); return; }
      if (!c.email?.trim()) { toast.error(`Contact #${i + 1} Email is required`); return; }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(c.email)) {
        toast.error(`Please enter a valid email for Contact #${i + 1}`); return;
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

  // Player Category CRUD
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

  // Sports Event CRUD
  const createDefaultEvent = (sportName: string): SportFormEvent => {
    const isTeam = isTeamSport(sportName);
    return {
      id: Math.random().toString(36).substring(2),
      eventName: "",
      startDate: "",
      endDate: "",
      gender: "",
      playersBorn: "",
      format: isTeam ? "TEAM" : "",
      formats: isTeam ? ["TEAM"] : [],
      minPlayers: isTeam ? String(getDefaultMinPlayers(sportName)) : "",
      maxPlayers: isTeam ? String(getDefaultMinPlayers(sportName) + 4) : "",
      minAge: "",
      maxAge: "",
      tournamentType: "",
      venueId: "",
      contactName: "",
      contactNumber: "",
      contactEmail: "",
      otherContacts: [],
      auctionEnabled: false,
      adminApprovalRequired: false,
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
    if (!trimmedName) { toast.error("Sport name is required"); return; }
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
        sportsService.getSportsMeta().then(setSportsMeta).catch(() => { /* data fetch fallback */ });
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
      if (updated.length === 0) setShowSportForm(false);
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
    for (const form of sportForms) {
      for (const ev of form.events) {
        if (!ev.eventName.trim()) { toast.error("Event Name is required"); return; }
        if (!ev.startDate || !ev.endDate) { toast.error("Start Date and End Date are required"); return; }

        // Date logic validation
        const eventStart = new Date(ev.startDate);
        const eventEnd = new Date(ev.endDate);

        if (eventEnd < eventStart) {
          toast.error(`Event "${ev.eventName}": End Date cannot be before Start Date`);
          return;
        }

        // Check against active tournament bounds if linked to a tournament
        if (activeTournamentId) {
          const currentTournament = activeTournaments.find((t) => t.id === activeTournamentId);
          const tourneyObj = currentTournament?.event || currentTournament;
          const tourneyStartStr = tourneyObj?.eventDateStart || tourneyObj?.startDate;
          const tourneyEndStr = tourneyObj?.eventDateEnd || tourneyObj?.endDate;

          if (tourneyStartStr && tourneyEndStr) {
            const tourneyStart = new Date(tourneyStartStr);
            const tourneyEnd = new Date(tourneyEndStr);

            if (eventStart < tourneyStart || eventStart > tourneyEnd) {
              toast.error(
                `Event "${ev.eventName}": Start Date (${ev.startDate}) must fall within tournament dates (${tourneyStartStr} to ${tourneyEndStr})`
              );
              return;
            }

            if (eventEnd < tourneyStart || eventEnd > tourneyEnd) {
              toast.error(
                `Event "${ev.eventName}": End Date (${ev.endDate}) must fall within tournament dates (${tourneyStartStr} to ${tourneyEndStr})`
              );
              return;
            }
          }
        }

        if (!ev.tournamentType) { toast.error("Tournament Format is required"); return; }
        if (!selectedTemplates[ev.id]) { toast.error("Player Category Template is required"); return; }
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
          toast.error("Please enter a valid Contact Email"); return;
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
          auctionEnabled: isTeam ? !!ev.auctionEnabled : false,
          adminApprovalRequired: ev.adminApprovalRequired !== false,
          tournamentId: activeTournamentId ?? undefined,
        };
        try {
          if (form.editingSportId && eIdx === 0) {
            await sportsService.updateSportsEvent(form.editingSportId, payload);
            toast.success(`Event "${payload.name}" updated successfully!`);
          } else {
            await sportsService.createSportsEvent(payload);
            toast.success(`Event "${payload.name}" created${activeTournamentId ? ` under tournament` : ""}!`);
          }
          successCount++;
        } catch (err) {
          console.error(`Save event error:`, err);
          toast.error(err instanceof Error ? err.message : `Failed to save ${payload.name}`);
          failCount++;
        }
      }
    }
    if (successCount > 0) refreshEvents();
    if (failCount === 0) resetSportForm();
    setSportSubmitting(false);
  };

  // Derived data
  const draftEvents = activeTournaments.filter(e => (e.event?.registrationStatus || e.registrationStatus) === "DRAFT");
  const liveEvents = activeTournaments.filter(e => {
    const status = e.event?.registrationStatus || e.registrationStatus;
    return status !== "DRAFT" && status !== "COMPLETED";
  });
  const completedEvents = activeTournaments.filter(e => (e.event?.registrationStatus || e.registrationStatus) === "COMPLETED");

  const selectedComm = communities.find(c => c.id === activeCommId);
  const isGeneralCommunity = selectedComm
    ? (selectedComm.type === "GENERAL" || selectedComm.name.toLowerCase() === "general")
    : ((user as any)?.community?.type === "GENERAL" || (user as any)?.community?.name?.toLowerCase() === "general");

  // Sidebar menu items
  const menuItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "sports-event", label: "Sports Event", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "teams", label: "Teams", icon: <Users className="w-4 h-4" /> },
    { id: "schedule", label: "Schedule", icon: <CalendarIcon className="w-4 h-4" /> },
    { id: "create-venue", label: "Venues", icon: <MapPin className="w-4 h-4" /> },
    { id: "player-category", label: "Player Category", icon: <Users className="w-4 h-4" /> },
    { id: "results", label: "Results", icon: <Trophy className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
    { id: "notification-analytics", label: "Notifications", icon: <BarChart3 className="w-4 h-4" /> },
  ];
  if (isAdmin) {
    menuItems.push({ id: "sports-meta", label: "Sports Meta", icon: <Trophy className="w-4 h-4" /> });
  }

  return {
    // Auth
    user, isAdmin, isSuperAdmin, activeCommId,

    // Tab state
    activeTab, setActiveTab, menuItems,

    // Communities
    communities, selectedCommId, setSelectedCommId,
    selectedComm, isGeneralCommunity, venueCommunities,

    // Tournament form
    eventName, setEventName,
    maxPax, setMaxPax,
    description, setDescription,
    editingEventId,
    startDate, setStartDate,
    endDate, setEndDate,
    regStartDate, setRegStartDate,
    regEndDate, setRegEndDate,
    startTime, setStartTime,
    dueTime, setDueTime,
    tournamentLevel, setTournamentLevel,
    bannerImage, setBannerImage, handleBannerUpload,
    allowAdminChat,
    submitting,
    handleSave, resetForm,

    // Contact & sponsors
    eventContactName, setEventContactName,
    eventContactNumber, setEventContactNumber,
    eventContactEmail, setEventContactEmail,
    otherContacts, addOtherContact, removeOtherContact, updateOtherContact,
    sponsors, addSponsor, removeSponsor, updateSponsor,

    // Sports selection (tournament form)
    sportsMeta, playerCategories,
    selectedSports, selectedSportsWithEvents,
    selectedEventIds, selectedCats,
    toggleSport, toggleSportsEvent, toggleCat,
    addEventToSport, removeEvent, updateEventField, removeSportCard,
    setConfiguringSportId, showSportConfigModal, setShowSportConfigModal, configuringSportId,

    // Notification schedule
    globalChannels, setGlobalChannels,
    previewTrigger, setPreviewTrigger,
    expandedTrigger, setExpandedTrigger,
    customTriggers, setCustomTriggers,
    triggerStates, setTriggerStates,
    showNotificationModal, setShowNotificationModal,
    allTriggersToRender,
    totalEnabledCount, totalOutputSends,
    currentActiveChannels, previewCount, previewPercentage,
    toggleGlobalChannel, toggleTriggerRow,
    handleTriggerFieldChange, toggleRecipient, toggleTriggerChannel,
    addCustomTrigger, removeCustomTrigger,
    getCompiledPreviewBody,
    getTournamentStartDateTime, formatINRDate,

    // Tournament-first flow
    activeTournamentId, activeTournamentName, clearTournamentContext, setTournamentContext,

    // Tournament data
    activeTournaments, activeEvents,
    draftEvents, liveEvents, completedEvents,
    handleEdit, handleDelete, handleActivate,
    activatingTournament, handleConfirmActivate, setActivatingTournament,
    announcingTournament, handleSendAnnouncement, setAnnouncingTournament,

    // Dashboard
    teamsList, pendingList, approveTeam, rejectTeam,

    // Registration
    viewingEventId, viewMode,
    registrations, nominatedCaptains, loadingRegs,
    handleViewPlayers, handleViewCaptains,
    handleConfirmRegistration, handleRejectRegistration, handleConfirmCaptain,

    // Manual add player
    showAddPlayerModal, setShowAddPlayerModal,
    selectedEventIdForAdd, setSelectedEventIdForAdd,
    addPlayerForms, setAddPlayerForms,
    communityUsers, loadingUsers,
    friendSearchQuery, setFriendSearchQuery,
    filteredFriends,
    handleSelectFriend, handleAddNewPlayerCard, handleDeletePlayerCard,
    handleAddPlayerSubmit, formatDob,

    // CSV Import
    showImportModal, setShowImportModal,
    importStep, setImportStep,
    selectedEventIdForImport, setSelectedEventIdForImport,
    csvFile, setCsvFile,
    parsedRows, setParsedRows,
    parsingError, importing, importProgress,
    handleDownloadSample, handleFileChange, handleImportSubmit,

    // Sports Event CRUD
    showSportForm, setShowSportForm,
    showSportPicker, setShowSportPicker,
    sportPickerSearch, setSportPickerSearch,
    sportForms, sportSubmitting,
    handleSportPickerSelect, handleCreateCustomSport,
    removeSportForm, addEventToSportForm, removeEventFromSportForm,
    updateSportFormEvent, handleSportSave, handleSportEdit, handleSportDelete,
    resetSportForm,
    selectedTemplates, setSelectedTemplates,
    openDropdownEventId, setOpenDropdownEventId,
    searchQueries, setSearchQueries,
    loadTournamentsListData, loadConfigureEventsData, refreshCategories,

    // Venues
    venues, selectedVenueId, selectedVenueDetails, loadingVenueDetails,
    showVenueDetailsModal, setShowVenueDetailsModal,
    showVenueForm, setShowVenueForm,
    editingVenueId,
    venueName, setVenueName,
    venueAddress, setVenueAddress,
    venueCity, setVenueCity,
    venueArea, setVenueArea,
    venueMapLink, setVenueMapLink,
    venueCapacity, setVenueCapacity,
    venueOpeningTime, setVenueOpeningTime,
    venueClosingTime, setVenueClosingTime,
    venueType, setVenueType,
    venueCommId, setVenueCommId,
    venueSubmitting, hiddenVenues,
    venueContacts, addVenueContact, removeVenueContact, updateVenueContact,
    courts, addCourt, removeCourt, updateCourt,
    venuePinCode, setVenuePinCode,
    resetVenueForm, handleVenueSave, handleVenueEdit, handleVenueHide, handleVenueDelete,
    refreshVenues,

    // Player Category CRUD
    showCategoryForm, setShowCategoryForm,
    editingCategoryId,
    categoryName, setCategoryName,
    categoryType, setCategoryType,
    categoryDescription, setCategoryDescription,
    categoryMinAge, setCategoryMinAge,
    categoryMaxAge, setCategoryMaxAge,
    categoryGender, setCategoryGender,
    categoryCommId, setCategoryCommId,
    categorySubmitting,
    resetCategoryForm, handleCategorySave, handleCategoryEdit, handleCategoryDelete,
  };
}
