import { Badge } from "react-bootstrap";

export const KycBadge = ({ status }) => {
  const cfg = {
    approved:   { color: "#0ecb81", bg: "rgba(14,203,129,0.12)",  label: "✓ KYC Verified" },
    pending:    { color: "#f0b90b", bg: "rgba(240,185,11,0.12)",  label: "⏳ KYC Pending"  },
    rejected:   { color: "#f6465d", bg: "rgba(246,70,93,0.12)",   label: "✕ KYC Rejected" },
    unverified: { color: "#848e9c", bg: "rgba(132,142,156,0.12)", label: "Unverified"      },
  }[status] || { color: "#848e9c", bg: "rgba(132,142,156,0.12)", label: "Unverified" };
  return (
    <span
      className="dash-kyc-badge"
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}33`,
        borderRadius: "4px",
        padding: "0.15rem 0.5rem",
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.03em",
      }}
    >
      {cfg.label}
    </span>
  );
};

export const StatCard = ({ label, value, sub, children }) => (
  <div className="dash-stat-card">
    <span className="dash-stat-label">{label}</span>
    {children ?? <span className="dash-stat-value">{value ?? "—"}</span>}
    {sub && <span className="dash-stat-sub">{sub}</span>}
  </div>
);

export const Skeleton = () => (
  <div className="dash-skeleton">
    <div className="dash-sk-line dash-sk-wide" />
    <div className="dash-sk-line" />
    <div className="dash-sk-line dash-sk-narrow" />
  </div>
);

export const EmptyState = ({ icon, text, action }) => (
  <div className="dash-empty">
    <i className={`bi bi-${icon} dash-empty-icon`} />
    <p className="dash-empty-text">{text}</p>
    {action}
  </div>
);
