import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Check, X, ExternalLink, CheckCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { notificationService, type NotificationItem } from "../../../services/notices/notificationService";

export function SportsNotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnread(res.count);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const page = await notificationService.getNotificationsSummary(0, 20);
      setNotifications(page.content);
    } catch { /* silent */ }
    setLoading(false);
  };

  const toggle = () => {
    if (!open) loadNotifications();
    setOpen((v) => !v);
  };

  const markRead = async (id: number) => {
    await notificationService.markAsRead([id]);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const dismiss = async (id: number) => {
    await notificationService.dismiss(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnread((c) => Math.max(0, c - 1));
  };

  const handleAction = (n: NotificationItem) => {
    if (!n.read) markRead(n.id);
    if (n.actionUrl) {
      navigate(n.actionUrl);
      setOpen(false);
    }
  };

  const priorityColor: Record<string, string> = {
    HIGH: "#ef4444",
    URGENT: "#dc2626",
    NORMAL: "#6366f1",
    LOW: "#94a3b8",
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        onClick={toggle}
        style={{
          position: "relative",
          background: open ? "rgba(99,102,241,0.1)" : "transparent",
          border: "none",
          borderRadius: 10,
          padding: "6px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => { if (!open) (e.currentTarget.style.background = "rgba(99,102,241,0.08)"); }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget.style.background = "transparent"); }}
        title="Notifications"
      >
        <Bell size={18} color={open ? "#4f46e5" : "#64748b"} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: "#ef4444",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              border: "2px solid #fff",
              lineHeight: 1,
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 360,
            maxHeight: 460,
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(99,102,241,0.08)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
              Notifications {unread > 0 && <span style={{ color: "#6366f1" }}>({unread})</span>}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6366f1",
                    fontSize: 11,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                  title="Mark all read"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2 }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <Bell size={32} color="#e2e8f0" style={{ margin: "0 auto 8px" }} />
                <p style={{ color: "#94a3b8", fontSize: 13 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "10px 14px",
                    background: n.read ? "transparent" : "rgba(99,102,241,0.04)",
                    borderBottom: "1px solid #f8fafc",
                    cursor: n.actionUrl ? "pointer" : "default",
                    transition: "background 0.15s",
                  }}
                  onClick={() => n.actionUrl && handleAction(n)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = n.read ? "#f8fafc" : "rgba(99,102,241,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? "transparent" : "rgba(99,102,241,0.04)"; }}
                >
                  {/* Unread dot */}
                  <div style={{ paddingTop: 6, width: 8, flexShrink: 0 }}>
                    {!n.read && (
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: priorityColor[n.priority ?? "NORMAL"] ?? "#6366f1" }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 600, color: "#1e293b", lineHeight: 1.35 }}>
                      {n.title}
                    </div>
                    {n.body && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {n.body}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                      {formatTime(n.createdAt)}
                      {n.category && (
                        <span style={{ background: "#f1f5f9", borderRadius: 4, padding: "1px 5px", fontSize: 10, fontWeight: 500 }}>
                          {n.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", flexShrink: 0, paddingTop: 2 }}>
                    {!n.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2 }}
                        title="Mark read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    {n.actionUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(n); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", padding: 2 }}
                        title="Go to action"
                      >
                        <ExternalLink size={13} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: 2 }}
                      title="Dismiss"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
