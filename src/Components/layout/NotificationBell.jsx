import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useNotificationStore } from "../../store/notificationStore.js";
import { useNotificationSocket } from "../../hooks/useNotificationSocket.js";
import {
  useMarkReadMutation,
  useNotificationsQuery,
  useUnreadCountQuery,
} from "../../hooks/queries/useNotificationQueries.js";
import "../../styles/notifications.css";

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CFG = {
  TRADE:  { icon: "bi-arrow-left-right", color: "#f0b90b", bg: "rgba(240,185,11,0.12)"  },
  ORDER:  { icon: "bi-receipt",          color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  WALLET: { icon: "bi-wallet2",          color: "#0ecb81", bg: "rgba(14,203,129,0.12)"  },
  SYSTEM: { icon: "bi-info-circle-fill", color: "#848e9c", bg: "rgba(132,142,156,0.12)" },
};

const relTime = (ts) => {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ── Single notification row ───────────────────────────────────────────────────

const NItem = ({ n, onMarkRead }) => {
  const cfg = TYPE_CFG[n.type] || TYPE_CFG.SYSTEM;
  const isUnread = n.status === "UNREAD";

  return (
    <div
      className={`nf-item${isUnread ? " nf-item--unread" : ""}`}
      onClick={() => isUnread && onMarkRead(n._id)}
    >
      <div className="nf-item-icon" style={{ color: cfg.color, background: cfg.bg }}>
        <i className={`bi ${cfg.icon}`} />
      </div>
      <div className="nf-item-body">
        <div className="nf-item-title">{n.title}</div>
        <div className="nf-item-msg">{n.message}</div>
        <div className="nf-item-time">{relTime(n.createdAt)}</div>
      </div>
      {isUnread && <span className="nf-item-dot" />}
    </div>
  );
};

// ── Bell + Dropdown ───────────────────────────────────────────────────────────

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { unreadCount, recentNotifications, setUnreadCount, prependNotifications, markOneRead, markAllReadLocal } =
    useNotificationStore();

  // Real-time socket
  useNotificationSocket({ enabled: true });

  // Initial unread count from API
  const { data: countData } = useUnreadCountQuery();
  useEffect(() => {
    if (countData?.count !== undefined) setUnreadCount(countData.count);
  }, [countData, setUnreadCount]);

  // Seed dropdown with recent notifications from API (once)
  const { data: recentData } = useNotificationsQuery({ limit: 10, page: 1 });
  useEffect(() => {
    if (recentData?.notifications?.length && recentNotifications.length === 0) {
      prependNotifications(recentData.notifications);
    }
  }, [recentData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markReadMutation = useMarkReadMutation();

  const handleMarkOne = (id) => {
    markOneRead(id);
    markReadMutation.mutate([id]);
  };

  const handleMarkAll = () => {
    markAllReadLocal();
    markReadMutation.mutate(null);
  };

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div className="nf-bell-wrap" ref={ref}>
      <button
        className="nf-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount ? ` (${displayCount} unread)` : ""}`}
      >
        <i className={`bi bi-bell${unreadCount > 0 ? "-fill" : ""}`} />
        {unreadCount > 0 && <span className="nf-bell-badge">{displayCount}</span>}
      </button>

      {open && (
        <div className="nf-dropdown">
          <div className="nf-dropdown-head">
            <span className="nf-dropdown-title">
              Notifications
              {unreadCount > 0 && <span className="nf-dropdown-count">{unreadCount} new</span>}
            </span>
            {unreadCount > 0 && (
              <button className="nf-mark-all-btn" onClick={handleMarkAll}>
                Mark all read
              </button>
            )}
          </div>

          <div className="nf-dropdown-list">
            {recentNotifications.length === 0 ? (
              <div className="nf-empty">
                <i className="bi bi-bell-slash" />
                <p>No notifications yet</p>
                <span>Trade, order, and wallet updates will appear here.</span>
              </div>
            ) : (
              recentNotifications.map((n) => (
                <NItem key={n._id} n={n} onMarkRead={handleMarkOne} />
              ))
            )}
          </div>

          <Link
            to="/Dashboard/notifications"
            className="nf-view-all-link"
            onClick={() => setOpen(false)}
          >
            View all notifications <i className="bi bi-arrow-right" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
