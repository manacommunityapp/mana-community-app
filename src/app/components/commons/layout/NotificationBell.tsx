import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, X, Trash2 } from "lucide-react";
import { notificationService, type NotificationItem } from "../../../../services/notificationService";

const CATEGORY_COLORS: Record<string, string> = {
  SPORTS: "bg-emerald-500",
  AUCTION: "bg-amber-500",
  EVENTS: "bg-blue-500",
  COMMUNITY: "bg-purple-500",
  GENERAL: "bg-slate-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  SPORTS: "Sports",
  AUCTION: "Auction",
  EVENTS: "Events",
  COMMUNITY: "Community",
  GENERAL: "General",
};

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
  const [open, setOpen] = useState(false);
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
      // silent
    }
  }, []);

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(pageNum, 15);
      setNotifications(prev => append ? [...prev, ...res.content] : res.content);
      setHasMore(!res.last);
      setPage(pageNum);
    } catch {
      // silent
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
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleDismiss = async (id: number) => {
    try {
      await notificationService.dismiss(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => {
        const was = notifications.find(n => n.id === id);
        return was && !was.read ? Math.max(0, prev - 1) : prev;
      });
    } catch { /* silent */ }
  };

  const handleDismissAll = async () => {
    try {
      await notificationService.dismissAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) fetchNotifications(page + 1, true);
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.read) handleMarkAsRead(n.id);
    if (n.actionUrl) {
      window.location.href = n.actionUrl;
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(prev => !prev)}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl border border-border bg-card shadow-sm relative transition-all cursor-pointer active:scale-95"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-card">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] max-h-[480px] bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDismissAll}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                  title="Dismiss all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">All caught up</p>
                <p className="text-xs text-muted-foreground/70 mt-1">No notifications right now</p>
              </div>
            ) : (
              <>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`group flex items-start gap-3 px-4 py-3 border-b border-border/50 transition-all cursor-pointer hover:bg-muted/30 ${!n.read ? "bg-primary/[0.03]" : ""}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    {/* Category dot */}
                    <div className="pt-1 shrink-0">
                      <div className={`h-2.5 w-2.5 rounded-full ${CATEGORY_COLORS[n.category || "GENERAL"] || CATEGORY_COLORS.GENERAL} ${!n.read ? "ring-2 ring-primary/20" : "opacity-50"}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${!n.read ? "text-primary" : "text-muted-foreground"}`}>
                          {CATEGORY_LABELS[n.category || "GENERAL"] || "General"}
                        </span>
                        {n.priority === "HIGH" || n.priority === "URGENT" ? (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            {n.priority}
                          </span>
                        ) : null}
                      </div>
                      <p className={`text-xs leading-snug ${!n.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>
                      )}
                      <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.read && (
                        <button
                          onClick={e => { e.stopPropagation(); handleMarkAsRead(n.id); }}
                          className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all cursor-pointer"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); handleDismiss(n.id); }}
                        className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all cursor-pointer"
                        title="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Load more */}
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="w-full py-3 text-xs font-semibold text-primary hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load more"}
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
