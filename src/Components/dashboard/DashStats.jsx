import { KycBadge, Skeleton } from "./DashShared";
import { fmtUsd } from "./dashUtils";

const StatCard = ({ label, value, sub, children }) => (
  <div className="dash-stat-card">
    <div className="dash-stat-label">{label}</div>
    <div className="dash-stat-value">{children ?? value}</div>
    {sub && <div className="dash-stat-sub">{sub}</div>}
  </div>
);

const DashStats = ({ isLoading, portfolio, user }) => (
  <div className="dash-stat-strip" style={{ marginBottom: "1.25rem" }}>
    {isLoading ? (
      [0, 1, 2, 3].map((k) => <Skeleton key={k} />)
    ) : (
      <>
        <StatCard
          label="Total Portfolio"
          value={fmtUsd(portfolio.totalBalanceUsdt)}
          sub="Estimated USDT value"
        />
        <StatCard
          label="Asset Wallets"
          value={portfolio.walletCount ?? "—"}
          sub="Active balance accounts"
        />
        <StatCard
          label="Open Orders"
          value={portfolio.openOrdersCount ?? "—"}
          sub="Pending on order book"
        />
        <StatCard
          label="Account Status"
          sub={user.kycStatus === "approved" ? "Identity verified" : "Complete KYC to unlock limits"}
        >
          <KycBadge status={user.kycStatus} />
        </StatCard>
      </>
    )}
  </div>
);

export default DashStats;
