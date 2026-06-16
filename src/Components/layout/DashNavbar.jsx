import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import NotificationBell from "./NotificationBell";
import "../../styles/dashboard.css";

const ConnectionDot = ({ status }) => {
  const cfg = {
    connected:    { color: "#22c55e", label: "Live",        pulse: true  },
    connecting:   { color: "#f59e0b", label: "Connecting…", pulse: false },
    disconnected: { color: "#ef4444", label: "Offline",     pulse: false },
    idle:         { color: "#64748b", label: "Idle",        pulse: false },
  }[status] || { color: "#64748b", label: "Idle", pulse: false };

  return (
    <span className="dash-conn-wrap">
      <span
        className={`dash-conn-dot${cfg.pulse ? " dash-conn-dot--pulse" : ""}`}
        style={{ background: cfg.color }}
      />
      <span className="dash-conn-label" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
    </span>
  );
};

// onMenuClick  — pass to show the hamburger (dashboard sidebar toggle)
// connectionStatus — pass to show the live connection indicator
const DashNavbar = ({ onMenuClick, connectionStatus }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="dash-navbar">
      <div className="dash-navbar-left">
        {onMenuClick && (
          <button
            className="dash-hamburger"
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list" />
          </button>
        )}
        <Link to="/Dashboard" className="dash-brand">
          <span className="dash-brand-main">TRUSONX</span>
          <span className="dash-brand-sub">CHANGER</span>
        </Link>
      </div>

      <div className="dash-navbar-right">
        {connectionStatus && <ConnectionDot status={connectionStatus} />}
        <NotificationBell />
        <div className="dash-user-chip">
          <i className="bi bi-person-circle" />
          <span className="dash-user-email">{user?.email || "—"}</span>
        </div>
        <button
          className="dash-logout-btn"
          onClick={handleLogout}
          title="Logout"
        >
          <i className="bi bi-box-arrow-right" />
        </button>
      </div>
    </nav>
  );
};

export default DashNavbar;
