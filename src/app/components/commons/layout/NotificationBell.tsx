import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Bell, Check, CheckCheck, X, Trash2, Trophy, CalendarDays,
  Megaphone, Sparkles, AlertCircle, ChevronRight, Filter
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { notificationService, type NotificationItem } from "../../../../services/notices/notificationService";
import { eventService } from "../../../../services/events/eventService";
import { noticeService } from "../../../../services/notices/noticeService";
import { sportsEventService } from "../../../../services/sports/sportsEventService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type NotificationCategory = "ALL" | "EVENTS" | "SPORTS" | "COMMUNITY" | "GENERAL";

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
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-700",
  },
  SPORTS: {
    label: "Sports",
    icon: Trophy,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
  },
  AUCTION: {
    label: "Sports Auction",
    icon: Sparkles,
    color: "text-amber-600",
    bg: "bg-amber-50",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
  },
  COMMUNITY: {
    label: "Community",
    icon: Megaphone,
    color: "text-sky-600",
    bg: "bg-sky-50",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-700",
  },
  GENERAL: {
    label: "General",
    icon: Bell,
    color: "text-slate-600",
    bg: "bg-slate-100",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
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

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>("ALL");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const prevUnreadRef = useRef<number>(0);

  const triggerBlink = useCallback(() => {
    setIsBlinking(true);
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
            if (!dismissedSet.has(item.id)) {
              list.push({
                ...item,
                read: item.read || readSet.has(item.id),
              });
            }
          }
        }
      } catch { /* fallback to dynamic entities */ }

      // 2. Fetch Latest Real Events & Poojas
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

      // 3. Fetch Latest Real Notices
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
                priority: notice.priority || "NORMAL",
                read: readSet.has(notifId),
                readAt: null,
                metadata: null,
                createdAt: notice.createdAt || new Date(Date.now() - 7200000).toISOString(),
              });
            }
          });
        }
      } catch { /* silent */ }

      // 4. Fetch Latest Real Sports Events / Tournaments
      try {
        const sports = await sportsEventService.getAllEvents();
        if (Array.isArray(sports)) {
          sports.forEach((s: any) => {
            const notifId = 300000 + (s.id || 0);
            if (!dismissedSet.has(notifId)) {
              list.push({
                id: notifId,
                type: "SPORTS_TOURNAMENT",
                category: "SPORTS",
                title: `🏆 ${s.name || s.title || "Sports Tournament"}`,
                body: s.description ? s.description.slice(0, 110) + (s.description.length > 110 ? "..." : "") : `Status: ${s.status || "Open for registration"}`,
                icon: "trophy",
                actionUrl: "/sports",
                referenceType: "TOURNAMENT",
                referenceId: s.id,
                priority: "HIGH",
                read: readSet.has(notifId),
                readAt: null,
                metadata: null,
                createdAt: s.createdAt || new Date(Date.now() - 10800000).toISOString(),
              });
            }
          });
        }
      } catch { /* silent */ }

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
  }, [triggerBlink]);

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
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

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

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.read) handleMarkAsRead(n.id);
    if (n.actionUrl) {
      setOpen(false);
      if (n.actionUrl.startsWith("/")) {
        navigate(n.actionUrl);
      } else {
        window.location.href = n.actionUrl;
      }
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeCategory === "ALL") return true;
    const cat = (n.category || "GENERAL").toUpperCase();
    if (activeCategory === "EVENTS") return cat === "EVENTS" || cat === "EVENT" || cat === "POOJA";
    if (activeCategory === "SPORTS") return cat === "SPORTS" || cat === "AUCTION";
    if (activeCategory === "COMMUNITY") return cat === "COMMUNITY" || cat === "NOTICES" || cat === "GENERAL";
    return cat === activeCategory;
  });

  const getCategoryCount = (cat: NotificationCategory) => {
    if (cat === "ALL") return notifications.length;
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
          "p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl border border-border bg-card shadow-xs relative transition-all cursor-pointer active:scale-95 flex items-center justify-center",
          unreadCount > 0 && "border-amber-400/80 bg-amber-50/40 text-amber-600 shadow-sm ring-2 ring-amber-300/60",
          isBlinking && "animate-pulse ring-4 ring-rose-400/90 bg-rose-50 text-rose-600 border-rose-400"
        )}
      >
        <Bell
          className={cn(
            "h-4.5 w-4.5 transition-transform",
            unreadCount > 0 && "text-amber-600 animate-[bounce_2.5s_infinite]",
            isBlinking && "animate-[spin_0.5s_ease-in-out_2] text-rose-600 scale-110"
          )}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80 duration-1000" />
            <span className="relative min-w-[18px] h-[18px] flex items-center justify-center bg-rose-600 text-white text-[10px] font-black rounded-full px-1 ring-2 ring-card shadow-xs animate-in zoom-in-50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed inset-x-2 top-14 max-h-[82vh] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[410px] sm:max-h-[540px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-white/10 border border-white/15">
                <Bell className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                  Notification Hub
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-black rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-white/70">Sports, Events & Community Alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/15 rounded-lg transition-all cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleDismissAll}
                  className="p-1.5 text-white/70 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-all cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/15 rounded-lg transition-all cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 p-2 bg-muted/40 border-b border-border overflow-x-auto hide-scrollbar shrink-0">
            {(
              [
                { id: "ALL", label: "All", icon: Filter },
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
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
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
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 min-h-[220px]">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3 text-muted-foreground/60">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-foreground">No notifications in {activeCategory.toLowerCase()}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  You're all caught up with your updates!
                </p>
              </div>
            ) : (
              <>
                {filteredNotifications.map((n) => {
                  const catKey = (n.category || "GENERAL").toUpperCase();
                  const catMeta = CATEGORIES[catKey] || CATEGORIES.GENERAL;
                  const Icon = catMeta.icon;

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                        !n.read
                          ? "bg-primary/[0.04] border-primary/25 hover:bg-primary/[0.08] hover:border-primary/40 shadow-2xs"
                          : "bg-card border-border/70 hover:bg-muted/40 hover:border-border"
                      }`}
                    >
                      {/* Icon Avatar */}
                      <div className={`w-9 h-9 rounded-xl ${catMeta.bg} ${catMeta.color} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${catMeta.badgeBg} ${catMeta.badgeText}`}>
                            {catMeta.label}
                          </span>
                          {n.priority === "HIGH" || n.priority === "URGENT" ? (
                            <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" /> Priority
                            </span>
                          ) : null}
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>

                        <h4 className={`text-xs leading-snug line-clamp-1 ${!n.read ? "font-black text-foreground" : "font-bold text-foreground/80"}`}>
                          {n.title}
                        </h4>

                        {n.body && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {n.body}
                          </p>
                        )}

                        {n.actionUrl && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-primary mt-1.5 group-hover:underline">
                            <span>View details</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        )}
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
                            className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(n.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                          title="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
