import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  useMarkReadMutation,
  useNotificationsQuery,
} from "../../hooks/queries/useNotificationQueries";
import { useNotificationStore } from "../../store/notificationStore";
import { useNotificationSocket } from "../../hooks/useNotificationSocket";
import DashNavbar from "../../Components/layout/DashNavbar";
import DashSidebar from "../../Components/dashboard/DashSidebar";
import "../../styles/dashboard.css";
import "../../styles/notifications.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_CFG = {
  TRADE:  { icon: "bi-arrow-left-right", color: "#f0b90b", bg: "rgba(240,185,11,0.12)",  label: "Trade"  },
  ORDER:  { icon: "bi-receipt",          color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  label: "Order"  },
  WALLET: { icon: "bi-wallet2",          color: "#0ecb81", bg: "rgba(14,203,129,0.12)",  label: "Wallet" },
  SYSTEM: { icon: "bi-info-circle-fill", color: "#848e9c", bg: "rgba(132,142,156,0.12)", label: "System" },
};

const fmtDate = (ts) => {
  try {
    return new Date(ts).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  } catch { return "—"; }
};

const Shimmer = ({ h = 60 }) => (
  <div className="db-shimmer" style={{ height: h, borderRadius: 10, width: "100%", marginBottom: 10 }} />
);

// ── Notification row ──────────────────────────────────────────────────────────

const NotifRow = ({ n, onMarkRead }) => {
  const cfg      = TYPE_CFG[n.type] || TYPE_CFG.SYSTEM;
  const isUnread = n.status === "UNREAD";

  return (
    <div className={`nf-row${isUnread ? " nf-row--unread" : ""}`}>
      <div className="nf-row-icon" style={{ color: cfg.color, background: cfg.bg }}>
        <i className={`bi ${cfg.icon}`} />
      </div>

      <div className="nf-row-body">
        <div className="nf-row-head-line">
          <span className="nf-row-title">{n.title}</span>
          <span className="nf-row-type-badge" style={{ color: cfg.color, background: cfg.bg }}>
            {cfg.label}
          </span>
        </div>
        <div className="nf-row-msg">{n.message}</div>
        <div className="nf-row-date">{fmtDate(n.createdAt)}</div>
      </div>

      <div className="nf-row-actions">
        {isUnread && (
          <button className="nf-rd-btn" onClick={() => onMarkRead(n._id)} title="Mark as read">
            <i className="bi bi-check2" />
          </button>
        )}
        {isUnread && <span className="nf-row-dot" />}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const FILTERS = [
  { key: "",       label: "All"    },
  { key: "TRADE",  label: "Trade"  },
  { key: "ORDER",  label: "Order"  },
  { key: "WALLET", label: "Wallet" },
  { key: "SYSTEM", label: "System" },
];

const DashNotifications = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // ── All hooks before conditional return ───────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [typeFilter,  setTypeFilter]  = useState("");
  const [page,        setPage]        = useState(1);

  const { unreadCount, markOneRead, markAllReadLocal } = useNotificationStore();
  useNotificationSocket({ enabled: true });

  const { data, isLoading } = useNotificationsQuery({
    page,
    limit: 20,
    ...(typeFilter ? { type: typeFilter } : {}),
  });

  const markReadMutation = useMarkReadMutation();

  // ── Auth guard ────────────────────────────────────────────────────────────
  const tok = localStorage.getItem("token");
  let usr = null;
  try { const r = localStorage.getItem("user"); usr = r && r !== "null" ? JSON.parse(r) : null; } catch {}
  if (!isAuthenticated && !(tok && usr && typeof usr === "object")) {
    return <Navigate to="/login" replace />;
  }

  const notifications = data?.notifications ?? [];
  const pages         = data?.pages         ?? 1;
  const total         = data?.total         ?? 0;

  const handleMarkOne = (id) => {
    markOneRead(id);
    markReadMutation.mutate([id]);
  };

  const handleMarkAll = () => {
    markAllReadLocal();
    markReadMutation.mutate(null);
  };

  const handleFilterChange = (key) => {
    setTypeFilter(key);
    setPage(1);
  };

  return (
    <div className="dash-root">
      <DashNavbar onMenuClick={() => setSidebarOpen((v) => !v)} />

      <div className="dash-body">
        <DashSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={() => { useAuthStore.getState().logout(); navigate("/login"); }}
        />

        <main className="dash-main nf-page">

          {/* ── Header ── */}
          <div className="nf-page-head">
            <div>
              <h1 className="nf-page-title">Notifications</h1>
              <p className="nf-page-sub">
                {total > 0 ? `${total} notification${total !== 1 ? "s" : ""}` : "No notifications"}
                {unreadCount > 0 && <span className="nf-page-unread">{unreadCount} unread</span>}
              </p>
            </div>
            {unreadCount > 0 && (
              <button className="nf-mark-all-page-btn" onClick={handleMarkAll} disabled={markReadMutation.isPending}>
                <i className="bi bi-check2-all" /> Mark all as read
              </button>
            )}
          </div>

          {/* ── Filter tabs ── */}
          <div className="nf-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`nf-filter-tab${typeFilter === f.key ? " nf-filter-tab--on" : ""}`}
                onClick={() => handleFilterChange(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ── List ── */}
          <div className="nf-list-card">
            {isLoading ? (
              <div style={{ padding: "1.25rem" }}>
                {[1,2,3,4,5].map((i) => <Shimmer key={i} />)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="nf-page-empty">
                <i className="bi bi-bell-slash" />
                <h4>No notifications</h4>
                <p>
                  {typeFilter
                    ? `No ${typeFilter.toLowerCase()} notifications found.`
                    : "Trade, order, and wallet updates will appear here as they happen."}
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifRow key={n._id} n={n} onMarkRead={handleMarkOne} />
              ))
            )}
          </div>

          {/* ── Pagination ── */}
          {pages > 1 && (
            <div className="nf-pager">
              <button className="nf-pg-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <i className="bi bi-chevron-left" />
              </button>
              <span className="nf-pg-info">{page} / {pages}</span>
              <button className="nf-pg-btn" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default DashNotifications;
