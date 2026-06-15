import { Link } from "react-router-dom";

const DashSidebar = ({ open, onClose, onLogout }) => (
  <>
    {open && <div className="dash-overlay" onClick={onClose} />}
    <aside className={`dash-sidebar${open ? " dash-sidebar--open" : ""}`}>
      <div className="dash-sidebar-inner">
        <p className="dash-sidebar-section">Overview</p>
        <Link to="/Dashboard" className="dash-sidebar-link dash-sidebar-link--active" onClick={onClose}>
          <i className="bi bi-grid-1x2-fill" /> Dashboard
        </Link>

        <p className="dash-sidebar-section">Trading</p>
        <Link to="/Dashboard/trade" className="dash-sidebar-link" onClick={onClose}>
          <i className="bi bi-graph-up-arrow" /> Trade
        </Link>
        <Link to="/Dashboard/spot" className="dash-sidebar-link" onClick={onClose}>
          <i className="bi bi-currency-exchange" /> Spot
        </Link>
        <Link to="/Dashboard/futures" className="dash-sidebar-link" onClick={onClose}>
          <i className="bi bi-lightning-charge-fill" /> Futures
        </Link>
        <Link to="/Dashboard/arbitrage" className="dash-sidebar-link" onClick={onClose}>
          <i className="bi bi-shuffle" /> Arbitrage
        </Link>

        <p className="dash-sidebar-section">Finance</p>
        <Link to="/wallet" className="dash-sidebar-link" onClick={onClose}>
          <i className="bi bi-wallet2" /> Wallet
        </Link>
        <Link to="/Dashboard/markets" className="dash-sidebar-link" onClick={onClose}>
          <i className="bi bi-bar-chart-line-fill" /> Markets
        </Link>

        <p className="dash-sidebar-section">Account</p>
        <Link to="/Dashboard/subscription" className="dash-sidebar-link" onClick={onClose}>
          <i className="bi bi-star-fill" /> Subscription
        </Link>
        <Link to="/Support" className="dash-sidebar-link" onClick={onClose}>
          <i className="bi bi-headset" /> Support
        </Link>
        <Link to="/Dashboard/contact" className="dash-sidebar-link" onClick={onClose}>
          <i className="bi bi-envelope" /> Contact
        </Link>

        <button className="dash-sidebar-link dash-sidebar-logout" onClick={onLogout}>
          <i className="bi bi-box-arrow-right" /> Logout
        </button>
      </div>
    </aside>
  </>
);

export default DashSidebar;
