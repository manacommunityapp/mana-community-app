import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Bell, Check, CheckCheck, X, Trash2, Trophy, CalendarDays,
  Megaphone, Sparkles, AlertCircle, ChevronRight, Filter
} from "lucide-react";
import { notificationService, type NotificationItem } from "../../../../services/notices/notificationService";

type NotificationCategory = "ALL" | "SPORTS" | "EVENTS" | "COMMUNITY" | "GENERAL";

interface CategoryMeta {
  label: string;
  icon: any;
  color: string;
  bg: string;
  badgeBg: string;
  badgeText: string;
}

const CATEGORIES: Record<string, CategoryMeta> = {
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
  EVENTS: {
    label: "Events & Poojas",
    icon: CalendarDays,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-700",
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

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 991,
    type: "SPORTS_REGISTRATION_OPEN",
    category: "SPORTS",
    title: "🏆 Annual Cricket Cup 2026 Registration is Open!",
    body: "Team registrations and player auction entries are now live. Submit your roster before Aug 30.",
    icon: "trophy",
    actionUrl: "/sports",
    referenceType: "TOURNAMENT",
    referenceId: 1,
    priority: "HIGH",
    read: false,
    readAt: null,
    metadata: null,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 992,
    type: "EVENT_PASS_APPROVED",
    category: "EVENTS",
    title: "🎉 Maha Ganapathi Pooja Gate Pass Confirmed",
    body: "Your digital sankalpam pass is ready with QR code. View and download your e-pass.",
    icon: "calendar",
    actionUrl: "/events",
    referenceType: "EVENT",
    referenceId: 101,
    priority: "NORMAL",
    read: false,
    readAt: null,
    metadata: null,
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 993,
    type: "COMMUNITY_NOTICE",
    category: "COMMUNITY",
    title: "📢 Society Maintenance & Water Supply Schedule",
    body: "Scheduled overhead tank cleaning this Saturday between 10:00 AM and 2:00 PM.",
    icon: "megaphone",
    actionUrl: "/notices",
    referenceType: "NOTICE",
    referenceId: 404,
    priority: "NORMAL",
    read: true,
    readAt: new Date(Date.now() - 120 * 60000).toISOString(),
    metadata: null,
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
  },
  {
    id: 994,
    type: "AUCTION_ALERT",
    category: "SPORTS",
    title: "⚡ Premier Badminton League Player Auction Live",
    body: "Live bidding has commenced in the Sports Arena. Track team bidding in real-time.",
    icon: "sparkles",
    actionUrl: "/sports?tab=auction",
    referenceType: "AUCTION",
    referenceId: 3,
    priority: "HIGH",
    read: true,
    readAt: new Date(Date.now() - 300 * 60000).toISOString(),
    metadata: null,
    createdAt: new Date(Date.now() - 360 * 60000).toISOString(),
  },
];

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
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.count);
    } catch {
      // If backend fails, calculate unread from state
      setUnreadCount((prev) => prev);
    }
  }, []);

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(pageNum, 20);
      if (res && res.content && res.content.length > 0) {
        setNotifications((prev) => append ? [...prev, ...res.content] : res.content);
        setHasMore(!res.last);
        const unread = res.content.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } else {
        // Fallback to default demo notifications if empty so all notification types are visible
        setNotifications((prev) => (append ? prev : DEFAULT_NOTIFICATIONS));
        setHasMore(false);
        setUnreadCount(DEFAULT_NOTIFICATIONS.filter((n) => !n.read).length);
      }
      setPage(pageNum);
    } catch {
      setNotifications((prev) => (append ? prev : DEFAULT_NOTIFICATIONS));
      setHasMore(false);
      setUnreadCount(DEFAULT_NOTIFICATIONS.filter((n) => !n.read).length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  useEffect(() => {
    if (open) {
      fetchNotifications(0);
    }
  }, [open, fetchNotifications]);

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
    try {
      await notificationService.markAsRead([id]);
    } catch { /* silent */ }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
    } catch { /* silent */ }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleDismiss = async (id: number) => {
    try {
      await notificationService.dismiss(id);
    } catch { /* silent */ }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const was = notifications.find((n) => n.id === id);
      return was && !was.read ? Math.max(0, prev - 1) : prev;
    });
  };

  const handleDismissAll = async () => {
    try {
      await notificationService.dismissAll();
    } catch { /* silent */ }
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) fetchNotifications(page + 1, true);
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
    if (activeCategory === "SPORTS") return cat === "SPORTS" || cat === "AUCTION";
    if (activeCategory === "EVENTS") return cat === "EVENTS" || cat === "EVENT";
    if (activeCategory === "COMMUNITY") return cat === "COMMUNITY" || cat === "NOTICES" || cat === "GENERAL";
    return cat === activeCategory;
  });

  const getCategoryCount = (cat: NotificationCategory) => {
    if (cat === "ALL") return notifications.length;
    return notifications.filter((n) => {
      const c = (n.category || "GENERAL").toUpperCase();
      if (cat === "SPORTS") return c === "SPORTS" || c === "AUCTION";
      if (cat === "EVENTS") return c === "EVENTS" || c === "EVENT";
      if (cat === "COMMUNITY") return c === "COMMUNITY" || c === "NOTICES" || c === "GENERAL";
      return c === cat;
    }).length;
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title="Notifications & Alerts"
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl border border-border bg-card shadow-xs relative transition-all cursor-pointer active:scale-95 flex items-center justify-center"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-[10px] font-black rounded-full px-1 ring-2 ring-card shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
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
                { id: "SPORTS", label: "Sports", icon: Trophy },
                { id: "EVENTS", label: "Events", icon: CalendarDays },
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

                {hasMore && (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="w-full py-2.5 text-xs font-bold text-primary hover:bg-primary/5 transition-all cursor-pointer rounded-xl disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load more notifications"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
