import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Bell, Check, CheckCheck, X, Trash2, Trophy, CalendarDays,
  Megaphone, Sparkles, AlertCircle, ChevronRight, Filter,
  Volume2, VolumeX, SlidersHorizontal, Inbox, Clock
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { notificationService, type NotificationItem } from "../../../../services/notices/notificationService";
import { eventService } from "../../../../services/events/eventService";
import { noticeService } from "../../../../services/notices/noticeService";
import { sportsService } from "../../../../services/sports/sportsService";
import { sportsEventService } from "../../../../services/sports/sportsEventService";
import { useAuth } from "../../../../contexts/AuthContext";
import { VIEW_NOTICES, VIEW_EVENTS, VIEW_SPORTS_MENU, VIEW_SPORTS_MAIN } from "../../../../constants/permissions";
import { canAccessModule } from "../../../../utils/permissionUtils";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type NotificationCategory = "ALL" | "UNREAD" | "EVENTS" | "SPORTS" | "COMMUNITY" | "GENERAL";

interface CategoryMeta {
  label: string;
  icon: any;
  color: string;
  bg: string;
  badgeBg: string;
  badgeText: string;
}

const CATEGORIES: Record<string, CategoryMeta> = {
  EVENTS: {
    label: "Events & Poojas",
    icon: CalendarDays,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    badgeBg: "bg-indigo-100 dark:bg-indigo-950/60",
    badgeText: "text-indigo-700 dark:text-indigo-300",
  },
  SPORTS: {
    label: "Sports",
    icon: Trophy,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/60",
    badgeText: "text-emerald-700 dark:text-emerald-300",
  },
  AUCTION: {
    label: "Sports Auction",
    icon: Sparkles,
    color: "text-amber-600",
    bg: "bg-amber-50",
    badgeBg: "bg-amber-100 dark:bg-amber-950/60",
    badgeText: "text-amber-700 dark:text-amber-300",
  },
  COMMUNITY: {
    label: "Community",
    icon: Megaphone,
    color: "text-sky-600",
    bg: "bg-sky-50",
    badgeBg: "bg-sky-100 dark:bg-sky-950/60",
    badgeText: "text-sky-700 dark:text-sky-300",
  },
  GENERAL: {
    label: "General",
    icon: Bell,
    color: "text-slate-600",
    bg: "bg-slate-100",
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    badgeText: "text-slate-700 dark:text-slate-300",
  },
};

function getStoredReadIds(): Set<number> {
  try {
    const raw = localStorage.getItem("mana_read_notification_ids");
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveStoredReadId(id: number) {
  try {
    const set = getStoredReadIds();
    set.add(id);
    localStorage.setItem("mana_read_notification_ids", JSON.stringify(Array.from(set)));
  } catch { /* silent */ }
}

function saveAllStoredReadIds(ids: number[]) {
  try {
    const set = getStoredReadIds();
    ids.forEach(id => set.add(id));
    localStorage.setItem("mana_read_notification_ids", JSON.stringify(Array.from(set)));
  } catch { /* silent */ }
}

function getStoredDismissedIds(): Set<number> {
  try {
    const raw = localStorage.getItem("mana_dismissed_notification_ids");
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveStoredDismissedId(id: number) {
  try {
    const set = getStoredDismissedIds();
    set.add(id);
    localStorage.setItem("mana_dismissed_notification_ids", JSON.stringify(Array.from(set)));
  } catch { /* silent */ }
}

function saveAllStoredDismissedIds(ids: number[]) {
  try {
    const set = getStoredDismissedIds();
    ids.forEach(id => set.add(id));
    localStorage.setItem("mana_dismissed_notification_ids", JSON.stringify(Array.from(set)));
  } catch { /* silent */ }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function playNotificationChime() {
  try {
    const isMuted = localStorage.getItem("mana_notifications_muted") === "true";
    if (isMuted) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch { /* silent fallback */ }
}

export function getTimelineGroup(dateStr: string): "Today" | "Yesterday" | "Earlier" {
  try {
    const notifDate = new Date(dateStr);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const time = notifDate.getTime();
    if (time >= todayStart) return "Today";
    if (time >= yesterdayStart) return "Yesterday";
    return "Earlier";
  } catch {
    return "Earlier";
  }
}

export function resolveNotificationUrl(n: NotificationItem): string {
  // If explicit valid module actionUrl exists and is not a generic placeholder
  if (n.actionUrl && n.actionUrl.trim() && n.actionUrl !== "#" && n.actionUrl !== "/" && n.actionUrl !== "/dashboard") {
    return n.actionUrl.trim();
  }

  const cat = (n.category || "").toUpperCase();
  const type = (n.type || "").toUpperCase();
  const refType = (n.referenceType || "").toUpperCase();
  const title = (n.title || "").toUpperCase();
  const body = (n.body || "").toUpperCase();

  // 1. Events & Poojas -> Event Dashboard (/events)
  if (
    cat.includes("EVENT") ||
    cat.includes("POOJA") ||
    cat.includes("SEVA") ||
    type.includes("EVENT") ||
    type.includes("POOJA") ||
    type.includes("SEVA") ||
    refType === "EVENT" ||
    title.includes("POOJA") ||
    title.includes("EVENT") ||
    title.includes("SEVA") ||
    title.includes("DARSHAN") ||
    title.includes("UTSAV") ||
    title.includes("FESTIVAL") ||
    title.includes("MAHOTSAV") ||
    title.includes("HOMAM") ||
    title.includes("ARCHANA") ||
    title.includes("AARTI") ||
    body.includes("UTSAV") ||
    body.includes("POOJA") ||
    body.includes("FESTIVAL")
  ) {
    if (n.referenceId) {
      return `/events?eventId=${n.referenceId}`;
    }
    return "/events";
  }

  // 2. Sports & Tournaments & Auctions -> Sports Dashboard (/sports)
  if (
    cat.includes("SPORT") ||
    cat.includes("AUCTION") ||
    type.includes("SPORT") ||
    type.includes("TOURNAMENT") ||
    type.includes("AUCTION") ||
    type.includes("MATCH") ||
    refType === "TOURNAMENT" ||
    refType === "SPORT" ||
    refType === "AUCTION" ||
    title.includes("TOURNAMENT") ||
    title.includes("AUCTION") ||
    title.includes("SPORTS") ||
    title.includes("CRICKET") ||
    title.includes("BADMINTON") ||
    title.includes("MATCH")
  ) {
    if (type.includes("AUCTION") || cat.includes("AUCTION")) {
      return "/sports/auction";
    }
    if (n.referenceId) {
      return `/sports?eventId=${n.referenceId}`;
    }
    return "/sports";
  }

  // 3. Community Notices & Announcements -> Notices (/notices)
  if (
    cat.includes("COMMUNITY") ||
    cat.includes("NOTICE") ||
    type.includes("NOTICE") ||
    refType === "NOTICE" ||
    title.includes("NOTICE") ||
    title.includes("ANNOUNCEMENT") ||
    title.includes("SOCIETY") ||
    body.includes("ANNOUNCEMENT") ||
    body.includes("NOTICE")
  ) {
    return "/notices";
  }

  // 4. Amenities & Bookings -> Resource Bookings (/bookings)
  if (
    cat.includes("BOOKING") ||
    cat.includes("AMENITY") ||
    type.includes("BOOKING") ||
    type.includes("AMENITY") ||
    refType === "RESOURCE" ||
    refType === "BOOKING" ||
    title.includes("BOOKING") ||
    title.includes("AMENITY") ||
    title.includes("CLUBHOUSE") ||
    title.includes("SLOT")
  ) {
    return "/bookings";
  }

  // 5. Helpdesk & Tickets -> Helpdesk (/helpdesk)
  if (
    cat.includes("HELPDESK") ||
    cat.includes("TICKET") ||
    cat.includes("COMPLAINT") ||
    type.includes("TICKET") ||
    type.includes("COMPLAINT") ||
    type.includes("HELPDESK") ||
    refType === "TICKET" ||
    title.includes("TICKET") ||
    title.includes("COMPLAINT") ||
    title.includes("ISSUE")
  ) {
    return "/helpdesk";
  }

  // 6. Marketplace -> Marketplace (/marketplace)
  if (
    cat.includes("MARKETPLACE") ||
    cat.includes("LISTING") ||
    type.includes("LISTING") ||
    type.includes("PRODUCT") ||
    refType === "MARKETPLACE" ||
    refType === "LISTING" ||
    title.includes("LISTING") ||
    title.includes("BUY & SELL")
  ) {
    if (n.referenceId) {
      return `/marketplace/${n.referenceId}`;
    }
    return "/marketplace";
  }

  // 7. Visitors & Security -> Visitors (/visitors)
  if (
    cat.includes("VISITOR") ||
    cat.includes("SECURITY") ||
    type.includes("VISITOR") ||
    refType === "VISITOR" ||
    title.includes("GATE PASS") ||
    title.includes("VISITOR") ||
    title.includes("GUEST ENTRY")
  ) {
    return "/visitors";
  }

  // 8. Polls & Voting -> Polls (/polls)
  if (
    cat.includes("POLL") ||
    cat.includes("VOTING") ||
    type.includes("POLL") ||
    refType === "POLL" ||
    title.includes("POLL") ||
    title.includes("VOTE")
  ) {
    return "/polls";
  }

  // 9. Jobs & Careers -> Jobs (/jobs)
  if (
    cat.includes("JOB") ||
    cat.includes("CAREER") ||
    cat.includes("CPN") ||
    type.includes("JOB") ||
    refType === "JOB" ||
    title.includes("JOB") ||
    title.includes("HIRING")
  ) {
    return "/jobs";
  }

  // 10. Food & Dining -> Food (/food)
  if (
    cat.includes("FOOD") ||
    cat.includes("DINING") ||
    type.includes("FOOD") ||
    type.includes("MEAL") ||
    refType === "FOOD"
  ) {
    return "/food";
  }

  // 11. Services -> Services Platform (/services)
  if (
    cat.includes("SERVICE") ||
    type.includes("SERVICE") ||
    refType === "SERVICE"
  ) {
    return "/services";
  }

  // Default fallback -> Events dashboard
  return "/events";
}

function getDestinationMeta(targetUrl: string) {
  if (targetUrl.startsWith("/events")) {
    return { name: "Events Dashboard", icon: "🎉", badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  }
  if (targetUrl.startsWith("/sports")) {
    return { name: "Sports Hub", icon: "🏆", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (targetUrl.startsWith("/notices")) {
    return { name: "Notice Board", icon: "📢", badgeClass: "bg-sky-50 text-sky-700 border-sky-200" };
  }
  if (targetUrl.startsWith("/bookings")) {
    return { name: "Resource Bookings", icon: "📅", badgeClass: "bg-purple-50 text-purple-700 border-purple-200" };
  }
  if (targetUrl.startsWith("/helpdesk")) {
    return { name: "Helpdesk & Tickets", icon: "🎫", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (targetUrl.startsWith("/marketplace")) {
    return { name: "Marketplace", icon: "🛍️", badgeClass: "bg-orange-50 text-orange-700 border-orange-200" };
  }
  if (targetUrl.startsWith("/visitors")) {
    return { name: "Visitor Pass", icon: "🚪", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  if (targetUrl.startsWith("/polls")) {
    return { name: "Community Polls", icon: "📊", badgeClass: "bg-teal-50 text-teal-700 border-teal-200" };
  }
  if (targetUrl.startsWith("/jobs")) {
    return { name: "Jobs & Careers", icon: "💼", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  if (targetUrl.startsWith("/food")) {
    return { name: "Food & Dining", icon: "🍽️", badgeClass: "bg-yellow-50 text-yellow-700 border-yellow-200" };
  }
  if (targetUrl.startsWith("/services")) {
    return { name: "Services Hub", icon: "🛠️", badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200" };
  }
  return { name: "Module Details", icon: "⚡", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" };
}

function getPartnerRegistrationId(n: NotificationItem): number | null {
  if (n.metadata) {
    try {
      const parsed = JSON.parse(n.metadata);
      if (parsed.registrationId) return Number(parsed.registrationId);
    } catch {
      const match = n.metadata.match(/"registrationId"\s*:\s*(\d+)/);
      if (match) return Number(match[1]);
    }
  }
  if (n.actionUrl && n.actionUrl.includes("confirmPartner=")) {
    const match = n.actionUrl.match(/confirmPartner=(\d+)/);
    if (match) return Number(match[1]);
  }
  return null;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, hasPermission, hasAnyPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>("ALL");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem("mana_notifications_muted") === "true";
    } catch {
      return false;
    }
  });
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferences, setPreferences] = useState<{
    events: boolean;
    sports: boolean;
    community: boolean;
    sound: boolean;
  }>(() => {
    try {
      const stored = localStorage.getItem("mana_notification_preferences");
      if (stored) return JSON.parse(stored);
    } catch { /* silent */ }
    return { events: true, sports: true, community: true, sound: true };
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const prevUnreadRef = useRef<number>(0);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    try {
      localStorage.setItem("mana_notifications_muted", String(next));
    } catch { /* silent */ }
  };

  const handleSavePreferences = (nextPrefs: typeof preferences) => {
    setPreferences(nextPrefs);
    try {
      localStorage.setItem("mana_notification_preferences", JSON.stringify(nextPrefs));
      localStorage.setItem("mana_notifications_muted", String(!nextPrefs.sound));
      setIsMuted(!nextPrefs.sound);
    } catch { /* silent */ }
  };

  const triggerBlink = useCallback(() => {
    setIsBlinking(true);
    playNotificationChime();
    const timer = setTimeout(() => setIsBlinking(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const fetchLiveNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const readSet = getStoredReadIds();
      const dismissedSet = getStoredDismissedIds();
      const list: NotificationItem[] = [];

      // 1. Fetch from Notification Backend API
      try {
        const res = await notificationService.getNotifications(0, 50);
        if (res && Array.isArray(res.content) && res.content.length > 0) {
          for (const item of res.content) {
            const cat = (item.category || "GENERAL").toUpperCase();
            if (!preferences.events && (cat === "EVENTS" || cat === "EVENT" || cat === "POOJA")) continue;
            if (!preferences.sports && (cat === "SPORTS" || cat === "AUCTION")) continue;
            if (!preferences.community && (cat === "COMMUNITY" || cat === "NOTICES")) continue;

            if (!dismissedSet.has(item.id)) {
              list.push({
                ...item,
                read: item.read || readSet.has(item.id),
              });
            }
          }
        }
      } catch { /* fallback to dynamic entities */ }

      // 2. Fetch Latest Real Events & Poojas (only if user has access to Events)
      const canViewEvents = preferences.events && (isSuperAdmin || (canAccessModule(user, "EVENTS") && hasPermission(VIEW_EVENTS)));
      if (canViewEvents) {
        try {
          const events = await eventService.getAllEvents();
          if (Array.isArray(events)) {
            events.forEach((evt) => {
              const notifId = 100000 + (evt.id || 0);
              if (!dismissedSet.has(notifId)) {
                const isPooja = (evt.category || "").toLowerCase().includes("pooja") || (evt.type || "").toLowerCase().includes("pooja");
                list.push({
                  id: notifId,
                  type: isPooja ? "POOJA_ANNOUNCEMENT" : "EVENT_ANNOUNCEMENT",
                  category: "EVENTS",
                  title: isPooja ? `🪔 ${evt.title}` : `🎉 ${evt.title}`,
                  body: evt.description
                    ? evt.description.slice(0, 110) + (evt.description.length > 110 ? "..." : "")
                    : (evt.location ? `Venue: ${evt.location} • Starting on ${evt.startDate}` : `Scheduled on ${evt.startDate}`),
                  icon: isPooja ? "sparkles" : "calendar",
                  actionUrl: `/events?eventId=${evt.id}`,
                  referenceType: "EVENT",
                  referenceId: evt.id,
                  priority: "NORMAL",
                  read: readSet.has(notifId),
                  readAt: null,
                  metadata: null,
                  createdAt: evt.createdAt || new Date(Date.now() - 3600000).toISOString(),
                });
              }
            });
          }
        } catch { /* silent */ }
      }

      // 3. Fetch Latest Real Notices (only if user has access to Notices)
      const canViewNotices = preferences.community && (isSuperAdmin || (canAccessModule(user, "NOTICES") && hasPermission(VIEW_NOTICES)));
      if (canViewNotices) {
        try {
          const notices = await noticeService.getNotices();
          if (Array.isArray(notices)) {
            notices.forEach((notice) => {
              const notifId = 200000 + (notice.id || 0);
              if (!dismissedSet.has(notifId)) {
                list.push({
                  id: notifId,
                  type: "COMMUNITY_NOTICE",
                  category: "COMMUNITY",
                  title: `📢 ${notice.title}`,
                  body: notice.body ? notice.body.slice(0, 110) + (notice.body.length > 110 ? "..." : "") : "New society announcement",
                  icon: "megaphone",
                  actionUrl: "/notices",
                  referenceType: "NOTICE",
                  referenceId: notice.id,
                  priority: notice.priority === "URGENT" || notice.priority === "HIGH" ? "HIGH" : "NORMAL",
                  read: readSet.has(notifId),
                  readAt: null,
                  metadata: null,
                  createdAt: notice.createdAt || new Date(Date.now() - 7200000).toISOString(),
                });
              }
            });
          }
        } catch { /* silent */ }
      }

      // Deduplicate by category + title
      const seen = new Set<string>();
      const deduplicated = list.filter((item) => {
        const key = `${item.category}-${item.title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Sort newest first
      deduplicated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(deduplicated);
      const unread = deduplicated.filter((n) => !n.read).length;
      if (unread > prevUnreadRef.current) {
        triggerBlink();
      }
      prevUnreadRef.current = unread;
      setUnreadCount(unread);
    } catch (err) {
      console.warn("Failed to load live notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [preferences, isSuperAdmin, user, hasPermission, triggerBlink]);

  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveNotifications]);

  useEffect(() => {
    const handleNewNotif = () => {
      fetchLiveNotifications();
      triggerBlink();
    };

    window.addEventListener("mana_notification_received", handleNewNotif);
    window.addEventListener("mana_notifications_updated", handleNewNotif);
    window.addEventListener("mana_event_created", handleNewNotif);
    window.addEventListener("mana_event_updated", handleNewNotif);
    window.addEventListener("mana_registrations_updated", handleNewNotif);
    window.addEventListener("mana_activities_updated", handleNewNotif);

    return () => {
      window.removeEventListener("mana_notification_received", handleNewNotif);
      window.removeEventListener("mana_notifications_updated", handleNewNotif);
      window.removeEventListener("mana_event_created", handleNewNotif);
      window.removeEventListener("mana_event_updated", handleNewNotif);
      window.removeEventListener("mana_registrations_updated", handleNewNotif);
      window.removeEventListener("mana_activities_updated", handleNewNotif);
    };
  }, [fetchLiveNotifications, triggerBlink]);

  useEffect(() => {
    if (open) {
      fetchLiveNotifications();
    }
  }, [open, fetchLiveNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (showPreferencesModal) return;
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, showPreferencesModal]);

  const handleMarkAsRead = async (id: number) => {
    saveStoredReadId(id);
    if (id < 100000) {
      try {
        await notificationService.markAsRead([id]);
      } catch { /* silent */ }
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    saveAllStoredReadIds(notifications.map((n) => n.id));
    try {
      await notificationService.markAllAsRead();
    } catch { /* silent */ }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleDismiss = async (id: number) => {
    saveStoredDismissedId(id);
    if (id < 100000) {
      try {
        await notificationService.dismiss(id);
      } catch { /* silent */ }
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const was = notifications.find((n) => n.id === id);
      return was && !was.read ? Math.max(0, prev - 1) : prev;
    });
  };

  const handleDismissAll = async () => {
    saveAllStoredDismissedIds(notifications.map((n) => n.id));
    try {
      await notificationService.dismissAll();
    } catch { /* silent */ }
    setNotifications([]);
    setUnreadCount(0);
  };

  const handlePartnerResponse = async (e: React.MouseEvent, n: NotificationItem, regId: number, accept: boolean) => {
    e.stopPropagation();
    let reason: string | undefined = undefined;
    if (!accept) {
      const entered = window.prompt("Optional reason for declining partner invitation:");
      if (entered === null) return;
      reason = entered || undefined;
    }
    setRespondingId(regId);
    try {
      await sportsService.respondToPartnerInvitation(regId, accept, reason);
      handleMarkAsRead(n.id);
      fetchLiveNotifications();
      window.dispatchEvent(new CustomEvent("mana_notifications_updated"));
      window.dispatchEvent(new CustomEvent("mana_registrations_updated"));
    } catch (err: any) {
      console.error("Failed to respond to partner invitation", err);
      alert(err?.response?.data?.message || err?.message || "Failed to respond to partner invitation");
    } finally {
      setRespondingId(null);
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.read) handleMarkAsRead(n.id);
    const targetUrl = resolveNotificationUrl(n);
    setOpen(false);
    if (targetUrl) {
      if (targetUrl.startsWith("/")) {
        navigate(targetUrl);
      } else {
        window.location.href = targetUrl;
      }
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeCategory === "ALL") return true;
      if (activeCategory === "UNREAD") return !n.read;
      const cat = (n.category || "GENERAL").toUpperCase();
      if (activeCategory === "EVENTS") return cat === "EVENTS" || cat === "EVENT" || cat === "POOJA";
      if (activeCategory === "SPORTS") return cat === "SPORTS" || cat === "AUCTION";
      if (activeCategory === "COMMUNITY") return cat === "COMMUNITY" || cat === "NOTICES" || cat === "GENERAL";
      return cat === activeCategory;
    });
  }, [notifications, activeCategory]);

  const timelineGroups = useMemo(() => {
    const today: NotificationItem[] = [];
    const yesterday: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];

    filteredNotifications.forEach((n) => {
      const group = getTimelineGroup(n.createdAt);
      if (group === "Today") today.push(n);
      else if (group === "Yesterday") yesterday.push(n);
      else earlier.push(n);
    });

    const result: { id: string; label: string; items: NotificationItem[] }[] = [];
    if (today.length > 0) result.push({ id: "today", label: "Today", items: today });
    if (yesterday.length > 0) result.push({ id: "yesterday", label: "Yesterday", items: yesterday });
    if (earlier.length > 0) result.push({ id: "earlier", label: "Earlier", items: earlier });
    return result;
  }, [filteredNotifications]);

  const getCategoryCount = (cat: NotificationCategory) => {
    if (cat === "ALL") return notifications.length;
    if (cat === "UNREAD") return notifications.filter((n) => !n.read).length;
    return notifications.filter((n) => {
      const c = (n.category || "GENERAL").toUpperCase();
      if (cat === "EVENTS") return c === "EVENTS" || c === "EVENT" || c === "POOJA";
      if (cat === "SPORTS") return c === "SPORTS" || c === "AUCTION";
      if (cat === "COMMUNITY") return c === "COMMUNITY" || c === "NOTICES" || c === "GENERAL";
      return c === cat;
    }).length;
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setIsBlinking(false);
        }}
        title="Notifications & Alerts"
        className={cn(
          "p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl border border-border bg-card shadow-xs relative transition-all cursor-pointer active:scale-95 flex items-center justify-center",
          unreadCount > 0 && "border-amber-400/80 bg-amber-50/40 text-amber-600 shadow-sm ring-2 ring-amber-300/60",
          isBlinking && "animate-pulse ring-4 ring-rose-400/90 bg-rose-50 text-rose-600 border-rose-400"
        )}
      >
        <Bell
          className={cn(
            "h-4 w-4 sm:h-4.5 sm:w-4.5 transition-transform",
            unreadCount > 0 && "text-amber-600 animate-[bounce_2.5s_infinite]",
            isBlinking && "animate-[spin_0.5s_ease-in-out_2] text-rose-600 scale-110"
          )}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80 duration-1000" />
            <span className="relative min-w-[16px] h-[16px] flex items-center justify-center bg-rose-600 text-white text-[9px] font-bold rounded-full px-1 ring-2 ring-card shadow-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed inset-x-2 top-14 max-h-[82vh] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[410px] sm:max-h-[540px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-2.5 sm:p-3 border-b border-border bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-lg bg-white/10 border border-white/15 shrink-0">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5 leading-tight">
                  Notification Hub
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[8.5px] font-bold rounded-full leading-none">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <p className="text-[9.5px] text-white/70 truncate leading-tight mt-0.5">Click any notification to open its module dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0 ml-2">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={toggleMute}
                className="p-1 text-white/75 hover:text-white hover:bg-white/15 rounded-md transition-all cursor-pointer"
                title={isMuted ? "Unmute alert sounds" : "Mute alert sounds"}
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5 text-white/50" /> : <Volume2 className="h-3.5 w-3.5 text-amber-300" />}
              </button>

              {/* Preferences Modal Trigger */}
              <button
                type="button"
                onClick={() => setShowPreferencesModal(true)}
                className="p-1 text-white/75 hover:text-white hover:bg-white/15 rounded-md transition-all cursor-pointer"
                title="Notification settings"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="p-1 text-white/75 hover:text-white hover:bg-white/15 rounded-md transition-all cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleDismissAll}
                  className="p-1 text-white/75 hover:text-rose-300 hover:bg-rose-500/20 rounded-md transition-all cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 text-white/75 hover:text-white hover:bg-white/15 rounded-md transition-all cursor-pointer"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 p-1.5 bg-muted/30 border-b border-border/60 overflow-x-auto hide-scrollbar shrink-0">
            {(
              [
                { id: "ALL", label: "All", icon: Filter },
                { id: "UNREAD", label: "Unread", icon: Inbox },
                { id: "EVENTS", label: "Events & Poojas", icon: CalendarDays },
                { id: "SPORTS", label: "Sports", icon: Trophy },
                { id: "COMMUNITY", label: "Community", icon: Megaphone },
              ] as const
            ).map((cat) => {
              const active = activeCategory === cat.id;
              const count = getCategoryCount(cat.id);
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-card text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/70"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-full font-bold leading-none ${
                      active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-2 min-h-[180px]">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center mb-2 text-muted-foreground/60">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-foreground">
                  {activeCategory === "UNREAD" ? "No unread notifications" : `No notifications in ${activeCategory.toLowerCase()}`}
                </p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">
                  You're all caught up with your updates!
                </p>
              </div>
            ) : (
              <>
                {timelineGroups.map((group) => (
                  <div key={group.id} className="space-y-1">
                    {/* Timeline Section Header */}
                    <div className="flex items-center justify-between px-2 py-0.5 bg-muted/50 rounded-md border border-border/40">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {group.label}
                      </span>
                      <span className="text-[8.5px] font-medium text-muted-foreground/70">
                        {group.items.length} {group.items.length === 1 ? "alert" : "alerts"}
                      </span>
                    </div>

                    {group.items.map((n) => {
                      const catKey = (n.category || "GENERAL").toUpperCase();
                      const catMeta = CATEGORIES[catKey] || CATEGORIES.GENERAL;
                      const Icon = catMeta.icon;
                      const targetUrl = resolveNotificationUrl(n);
                      const destMeta = getDestinationMeta(targetUrl);

                      return (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`group p-2 sm:p-2.5 rounded-lg sm:rounded-xl border transition-all cursor-pointer flex items-start gap-2 sm:gap-2.5 relative ${
                            !n.read
                              ? "bg-primary/[0.04] border-primary/25 hover:bg-primary/[0.08] hover:border-primary/40 shadow-2xs"
                              : "bg-card border-border/60 hover:bg-muted/40 hover:border-border"
                          }`}
                        >
                          {/* Icon Avatar */}
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${catMeta.bg} ${catMeta.color} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <span className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded leading-none ${catMeta.badgeBg} ${catMeta.badgeText}`}>
                                {catMeta.label}
                              </span>
                              {n.priority === "HIGH" || n.priority === "URGENT" ? (
                                <span className="text-[8.5px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5 leading-none">
                                  <AlertCircle className="w-2.5 h-2.5" /> Priority
                                </span>
                              ) : null}
                              <span className="text-[9.5px] text-muted-foreground ml-auto">
                                {timeAgo(n.createdAt)}
                              </span>
                            </div>

                            <h4 className={`text-xs leading-snug line-clamp-1 ${!n.read ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                              {n.title}
                            </h4>

                            {n.body && (
                              <p className="text-[10.5px] sm:text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                {n.body}
                              </p>
                            )}

                            {(() => {
                              const partnerRegId = (n.type === "PARTNER_SELECTED" || (n.title && n.title.toLowerCase().includes("doubles partner"))) ? getPartnerRegistrationId(n) : null;
                              if (!partnerRegId) return null;
                              return (
                                <div className="mt-1.5 pt-1.5 border-t border-border/60 flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={respondingId === partnerRegId}
                                    onClick={(e) => handlePartnerResponse(e, n, partnerRegId, true)}
                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-bold rounded-md transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>{respondingId === partnerRegId ? "Confirming..." : "Accept"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={respondingId === partnerRegId}
                                    onClick={(e) => handlePartnerResponse(e, n, partnerRegId, false)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 text-[10px] font-bold rounded-md transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Decline</span>
                                  </button>
                                </div>
                              );
                            })()}

                            {/* Destination Link Badge */}
                            <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-border/40">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${destMeta.badgeClass}`}>
                                <span>{destMeta.icon}</span>
                                <span>{destMeta.name}</span>
                              </span>

                              <div className="flex items-center gap-0.5 text-[10px] font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                                <span>Open</span>
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!n.read && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(n.id);
                                }}
                                className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all cursor-pointer"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss(n.id);
                              }}
                              className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all cursor-pointer"
                              title="Dismiss"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Notification Preferences Modal */}
      {showPreferencesModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4"
          onClick={() => setShowPreferencesModal(false)}
        >
          <div
            className="bg-card border border-border w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-border bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold text-foreground">Notification Preferences</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-3.5 space-y-3 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-foreground">Play Sound Chime</span>
                <input
                  type="checkbox"
                  checked={preferences.sound}
                  onChange={(e) => handleSavePreferences({ ...preferences, sound: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-0 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-foreground">Events &amp; Poojas Alerts</span>
                <input
                  type="checkbox"
                  checked={preferences.events}
                  onChange={(e) => handleSavePreferences({ ...preferences, events: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-0 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-foreground">Sports &amp; Tournament Alerts</span>
                <input
                  type="checkbox"
                  checked={preferences.sports}
                  onChange={(e) => handleSavePreferences({ ...preferences, sports: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-0 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-foreground">Community Notices &amp; Board</span>
                <input
                  type="checkbox"
                  checked={preferences.community}
                  onChange={(e) => handleSavePreferences({ ...preferences, community: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
            <div className="p-2.5 border-t border-border bg-muted/20 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
