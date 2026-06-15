import { useState, useMemo, useEffect } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  useDepositMutation,
  useMyWalletsQuery,
  useWalletTransactionsQuery,
  useWithdrawMutation,
} from "../hooks/queries/useWalletQueries";
import { useSupportedAssets } from "../hooks/queries/useAssetsQuery";
import { useWalletSocket } from "../hooks/useWalletSocket";
import { useMarketSocket } from "../hooks/useMarketSocket";
import { useLiveMarketStore } from "../store/liveMarketStore";
import DashNavbar from "../Components/layout/DashNavbar";
import DashSidebar from "../Components/dashboard/DashSidebar";
import "../styles/wallet.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

const USD = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD",
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const fmtUSD  = (n) => USD.format(n ?? 0);
const fmtPct  = (n) => { const v = Number(n ?? 0); return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`; };
const fmtDate = (d) => { try { return new Date(d).toLocaleString([], { dateStyle: "short", timeStyle: "short" }); } catch { return "—"; } };

const fmtCrypto = (n, dec = 6) =>
  Number.isFinite(+n) ? (+n).toFixed(Math.min(Math.max(dec, 2), 8)) : "—";

// deterministic color per coin symbol
const COIN_COLOR_MAP = {
  BTC:"#f7931a", ETH:"#627eea", USDT:"#26a17b", USDC:"#2775ca",
  BNB:"#f3ba2f", SOL:"#9945ff", XRP:"#00aae4", ADA:"#0066ff",
  DOGE:"#c5a66a", AVAX:"#e84142", LINK:"#2a5ada", DOT:"#e6007a",
  MATIC:"#8247e5", TRX:"#ef0027", LTC:"#bfbbbb", UNI:"#ff007a",
  ATOM:"#6f7fb5", NEAR:"#00c1de", ARB:"#28a0f0", OP:"#ff0420",
  TRUSON:"#f0b90b",
};
const PALETTE = ["#f7931a","#627eea","#26a17b","#2775ca","#f3ba2f","#9945ff","#00aae4","#e84142","#0066ff","#c5a66a","#ff6b35","#4ecdc4","#f0b90b","#45b7d1"];
const getCoinColor = (sym) => {
  if (COIN_COLOR_MAP[sym]) return COIN_COLOR_MAP[sym];
  const h = [...(sym||"X")].reduce((a,c)=>a+c.charCodeAt(0),0);
  return PALETTE[h % PALETTE.length];
};

const getLivePrice = (symbol, assetMap, tickers) => {
  if (symbol === "USDT" || symbol === "USDC") return 1;
  const t = tickers?.[`${symbol}USDT`];
  if (t?.lastPrice) return Number(t.lastPrice);
  return assetMap[symbol]?.price ?? 0;
};

const get24hChange = (symbol, tickers) => {
  if (symbol === "USDT" || symbol === "USDC") return 0;
  return Number(tickers?.[`${symbol}USDT`]?.priceChangePct ?? 0);
};

// ── Coin Badge ────────────────────────────────────────────────────────────────

const CoinBadge = ({ symbol, size = 36 }) => {
  const color = getCoinColor(symbol);
  return (
    <span
      className="wp-coin-badge"
      style={{
        width: size, height: size, minWidth: size,
        background: `${color}1a`,
        border: `1.5px solid ${color}40`,
        color,
        fontSize: size < 30 ? "0.58rem" : "0.68rem",
      }}
    >
      {(symbol || "?").slice(0, 4)}
    </span>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const Shimmer = ({ h = 14, w = "100%", r = 6, mb = 0 }) => (
  <div className="wp-shimmer" style={{ height: h, width: w, borderRadius: r, marginBottom: mb }} />
);

const SkeletonPortfolio = () => (
  <div className="wp-portfolio-card">
    <div className="wp-portfolio-top">
      <div style={{ flex: 1 }}>
        <Shimmer h={12} w={130} mb={10} />
        <Shimmer h={44} w={220} mb={8} />
        <Shimmer h={12} w={180} />
      </div>
      <div style={{ display:"flex", gap:"2rem" }}>
        {[1,2,3].map(i => <div key={i}><Shimmer h={10} w={60} mb={6}/><Shimmer h={18} w={80}/></div>)}
      </div>
    </div>
    <div style={{ display:"flex", gap:"0.75rem", marginTop:"1.5rem" }}>
      {[1,2,3,4].map(i=><Shimmer key={i} h={38} w={110} r={8}/>)}
    </div>
  </div>
);

const SkeletonRows = ({ n = 5 }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <tr key={i} className="wp-row">
        <td className="wp-td wp-td--coin">
          <div className="wp-coin-info">
            <Shimmer h={36} w={36} r={50} />
            <div><Shimmer h={13} w={80} mb={5}/><Shimmer h={10} w={40}/></div>
          </div>
        </td>
        {[1,2,3,4,5,6].map(j=><td key={j} className="wp-td wp-td--num"><Shimmer h={13} w={70}/></td>)}
        <td className="wp-td wp-td--actions"><Shimmer h={26} w={160} r={6}/></td>
      </tr>
    ))}
  </>
);

// ── Portfolio Overview Card ───────────────────────────────────────────────────

const PortfolioCard = ({ wallets, assetMap, tickers, loading, hidden, onToggleHide, onAction }) => {
  const totals = useMemo(() => {
    let total = 0, available = 0, locked = 0;
    for (const w of wallets) {
      const price = getLivePrice(w.asset, assetMap, tickers);
      total     += (w.balance   ?? 0) * price;
      available += (w.available ?? 0) * price;
      locked    += (w.locked    ?? 0) * price;
    }
    return { total, available, locked };
  }, [wallets, assetMap, tickers]);

  if (loading) return <SkeletonPortfolio />;

  return (
    <div className="wp-portfolio-card">
      {/* decorative glow */}
      <div className="wp-portfolio-glow" />

      <div className="wp-portfolio-top">
        <div className="wp-portfolio-left">
          <div className="wp-label-sm">
            Estimated Total Balance
            <button className="wp-icon-btn" onClick={onToggleHide} title={hidden ? "Show" : "Hide"}>
              <i className={`bi bi-eye${hidden ? "" : "-slash"}`} />
            </button>
          </div>
          <div className="wp-portfolio-big-value">
            {hidden ? <span className="wp-blur-val">$••••••.••</span> : fmtUSD(totals.total)}
          </div>
          <div className="wp-portfolio-assets-hint">
            {wallets.length} asset{wallets.length !== 1 ? "s" : ""} in portfolio
          </div>
        </div>

        <div className="wp-portfolio-stats">
          <div className="wp-pstat">
            <div className="wp-pstat-label">Available</div>
            <div className="wp-pstat-value">{hidden ? "••••" : fmtUSD(totals.available)}</div>
          </div>
          <div className="wp-pstat-sep" />
          <div className="wp-pstat">
            <div className="wp-pstat-label">In Orders</div>
            <div className="wp-pstat-value wp-pstat-value--locked">{hidden ? "••••" : fmtUSD(totals.locked)}</div>
          </div>
          <div className="wp-pstat-sep" />
          <div className="wp-pstat">
            <div className="wp-pstat-label">Total Assets</div>
            <div className="wp-pstat-value">{wallets.filter(w=>(w.balance??0)>0).length}</div>
          </div>
        </div>
      </div>

      <div className="wp-quick-actions">
        <button className="wp-qa wp-qa--primary" onClick={() => onAction("deposit")}>
          <i className="bi bi-arrow-down-circle-fill" />Deposit
        </button>
        <button className="wp-qa" onClick={() => onAction("withdraw")}>
          <i className="bi bi-arrow-up-circle-fill" />Withdraw
        </button>
        <Link to="/Dashboard/trade" className="wp-qa">
          <i className="bi bi-bar-chart-line-fill" />Trade
        </Link>
        <Link to="/Dashboard/markets" className="wp-qa">
          <i className="bi bi-grid-1x2-fill" />Markets
        </Link>
      </div>
    </div>
  );
};

// ── Assets Table ──────────────────────────────────────────────────────────────

const AssetRow = ({ row, hidden, onDeposit, onWithdraw }) => {
  const { asset, meta, balance, available, locked, usd, change } = row;
  const dec = meta?.decimals ?? 6;
  const dir = change > 0 ? "up" : change < 0 ? "dn" : "flat";

  return (
    <tr className="wp-row">
      <td className="wp-td wp-td--coin">
        <div className="wp-coin-info">
          <CoinBadge symbol={asset} size={38} />
          <div>
            <div className="wp-coin-name">{meta?.name || asset}</div>
            <div className="wp-coin-sym">{asset}</div>
          </div>
        </div>
      </td>
      <td className="wp-td wp-td--num">{hidden ? "••••" : fmtCrypto(available, dec)}</td>
      <td className="wp-td wp-td--num">
        <span className={locked > 0 ? "wp-locked" : "wp-dim"}>
          {hidden ? "••••" : fmtCrypto(locked, dec)}
        </span>
      </td>
      <td className="wp-td wp-td--num wp-td--bold">{hidden ? "••••" : fmtCrypto(balance, dec)}</td>
      <td className="wp-td wp-td--num">{hidden ? "••••" : fmtUSD(usd)}</td>
      <td className="wp-td wp-td--num">
        {asset === "USDT" || asset === "USDC"
          ? <span className="wp-dim">—</span>
          : <span className={`wp-chg wp-chg--${dir}`}>{fmtPct(change)}</span>}
      </td>
      <td className="wp-td wp-td--actions">
        <div className="wp-row-acts">
          <button className="wp-rbtn wp-rbtn--dep" onClick={() => onDeposit(asset)}>Deposit</button>
          <button className="wp-rbtn wp-rbtn--wd"  onClick={() => onWithdraw(asset)}>Withdraw</button>
          <Link   to="/Dashboard/trade" className="wp-rbtn">Trade</Link>
        </div>
      </td>
    </tr>
  );
};

const AssetsTable = ({ wallets, assetMap, tickers, loading, hidden, onDeposit, onWithdraw }) => {
  const [q,        setQ]        = useState("");
  const [hideZero, setHideZero] = useState(true);
  const [hideLow,  setHideLow]  = useState(false);
  const [sortBy,   setSortBy]   = useState("usd");
  const [sortDir,  setSortDir]  = useState(-1);
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 20;

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(d => -d);
    else { setSortBy(key); setSortDir(-1); }
    setPage(1);
  };

  const rows = useMemo(() => {
    let list = wallets.map(w => {
      const meta   = assetMap[w.asset] || {};
      const price  = getLivePrice(w.asset, assetMap, tickers);
      const change = get24hChange(w.asset, tickers);
      return { ...w, meta, price, change, usd: (w.balance ?? 0) * price };
    });
    if (hideZero) list = list.filter(r => (r.balance ?? 0) > 0);
    if (hideLow)  list = list.filter(r => r.usd >= 0.01);
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter(r =>
        r.asset.toLowerCase().includes(lq) || (r.meta?.name || "").toLowerCase().includes(lq)
      );
    }
    list.sort((a, b) => {
      if (sortBy === "name")   return sortDir * a.asset.localeCompare(b.asset);
      if (sortBy === "avail")  return sortDir * ((b.available ?? 0) - (a.available ?? 0));
      if (sortBy === "total")  return sortDir * ((b.balance ?? 0)   - (a.balance ?? 0));
      if (sortBy === "usd")    return sortDir * (b.usd    - a.usd);
      if (sortBy === "change") return sortDir * (b.change - a.change);
      return 0;
    });
    return list;
  }, [wallets, assetMap, tickers, q, hideZero, hideLow, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const visible    = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const SortTh = ({ label, k, align = "right" }) => (
    <th className={`wp-th${align === "right" ? " wp-th--r" : ""}`}>
      <button className="wp-sort-btn" onClick={() => toggleSort(k)}>
        {label}
        {sortBy === k
          ? <i className={`bi bi-caret-${sortDir === -1 ? "down" : "up"}-fill wp-sort-act`} />
          : <i className="bi bi-chevron-expand wp-sort-icon" />}
      </button>
    </th>
  );

  return (
    <div className="wp-assets-card">
      {/* Header */}
      <div className="wp-card-head">
        <div className="wp-card-title">
          My Assets
          <span className="wp-badge">{rows.length}</span>
        </div>
        <div className="wp-controls">
          <div className="wp-search">
            <i className="bi bi-search wp-search-ico" />
            <input
              className="wp-search-inp"
              placeholder="Search coin…"
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
            />
            {q && <button className="wp-search-clr" onClick={() => setQ("")}><i className="bi bi-x" /></button>}
          </div>
          <label className="wp-chk-lbl">
            <input type="checkbox" checked={hideZero} onChange={e => { setHideZero(e.target.checked); setPage(1); }} />
            Hide zero
          </label>
          <label className="wp-chk-lbl">
            <input type="checkbox" checked={hideLow} onChange={e => { setHideLow(e.target.checked); setPage(1); }} />
            Hide &lt;$0.01
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="wp-table-wrap">
        <table className="wp-table">
          <thead>
            <tr>
              <SortTh label="Coin" k="name" align="left" />
              <SortTh label="Available" k="avail" />
              <th className="wp-th wp-th--r">In Orders</th>
              <SortTh label="Total" k="total" />
              <SortTh label="USD Value" k="usd" />
              <SortTh label="24h Change" k="change" />
              <th className="wp-th wp-th--r wp-th--acts">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows n={6} />
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="wp-empty">
                    <i className="bi bi-wallet2" />
                    <div className="wp-empty-h">{q ? "No matching assets" : "No assets yet"}</div>
                    <div className="wp-empty-sub">
                      {q ? "Try a different search term." : "Make your first deposit to get started."}
                    </div>
                    {!q && (
                      <button className="wp-qa wp-qa--primary wp-mt-1" onClick={() => onDeposit(null)}>
                        <i className="bi bi-arrow-down-circle-fill" /> Deposit Now
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              visible.map(row => (
                <AssetRow
                  key={row.asset}
                  row={row}
                  hidden={hidden}
                  onDeposit={onDeposit}
                  onWithdraw={onWithdraw}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="wp-pager">
          <button className="wp-pg-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <i className="bi bi-chevron-left" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`wp-pg-btn${page === i+1 ? " wp-pg-btn--on" : ""}`}
              onClick={() => setPage(i+1)}
            >{i+1}</button>
          ))}
          <button className="wp-pg-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Deposit Modal ─────────────────────────────────────────────────────────────

const DepositModal = ({ initialAsset, assets, onClose }) => {
  const [asset, setAsset]   = useState(initialAsset || assets[0]?.symbol || "USDT");
  const [amount, setAmount] = useState("");
  const [fb, setFb]         = useState(null);
  const mutation = useDepositMutation();
  const meta = assets.find(a => a.symbol === asset) || {};

  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault(); setFb(null);
    const n = parseFloat(amount);
    if (!n || n <= 0) { setFb({ t:"err", msg:"Enter a valid positive amount." }); return; }
    try {
      await mutation.mutateAsync({ asset, amount: n });
      setFb({ t:"ok", msg:`${n} ${asset} deposited successfully.` });
      setAmount("");
    } catch (err) {
      setFb({ t:"err", msg: err?.message || "Deposit failed." });
    }
  };

  return (
    <div className="wp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wp-modal" role="dialog" aria-modal="true" aria-label="Deposit">
        <div className="wp-modal-hdr">
          <div className="wp-modal-title">
            <span className="wp-modal-icon wp-modal-icon--dep"><i className="bi bi-arrow-down-circle-fill" /></span>
            Deposit Crypto
          </div>
          <button className="wp-icon-btn" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>

        <div className="wp-modal-body">
          {fb && (
            <div className={`wp-alert wp-alert--${fb.t === "ok" ? "ok" : "err"}`}>
              <i className={`bi bi-${fb.t === "ok" ? "check-circle-fill" : "exclamation-circle-fill"}`} />
              {fb.msg}
            </div>
          )}
          <form onSubmit={submit} noValidate>
            <div className="wp-field">
              <label className="wp-flabel">Asset</label>
              <select className="wp-sel" value={asset} onChange={e => { setAsset(e.target.value); setFb(null); }}>
                {assets.map(a => <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>)}
              </select>
            </div>

            {meta.network && (
              <div className="wp-net-badge">
                <i className="bi bi-hdd-network" /> Network: <b>{meta.network}</b>
              </div>
            )}

            <div className="wp-field">
              <label className="wp-flabel">Amount</label>
              <input type="number" className="wp-inp" placeholder="0.00" min="0" step="any"
                value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>

            <div className="wp-notice">
              <i className="bi bi-info-circle-fill" />
              Simulated deposit — no real funds are transferred.
            </div>

            <button type="submit" className="wp-submit wp-submit--dep" disabled={mutation.isPending}>
              {mutation.isPending
                ? <><i className="bi bi-hourglass-split" /> Processing…</>
                : <><i className="bi bi-arrow-down-circle-fill" /> Deposit {asset}</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Withdraw Modal ────────────────────────────────────────────────────────────

const WithdrawModal = ({ initialAsset, assets, wallets, assetMap, onClose }) => {
  const [asset,   setAsset]   = useState(initialAsset || assets[0]?.symbol || "USDT");
  const [amount,  setAmount]  = useState("");
  const [address, setAddress] = useState("");
  const [fb, setFb]           = useState(null);
  const mutation = useWithdrawMutation();
  const meta   = assetMap[asset] || {};
  const wallet = wallets.find(w => w.asset === asset);
  const avail  = wallet?.available ?? 0;
  const dec    = meta.decimals ?? 6;

  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault(); setFb(null);
    const n = parseFloat(amount);
    if (!n || n <= 0) { setFb({ t:"err", msg:"Enter a valid positive amount." }); return; }
    if (n > avail)    { setFb({ t:"err", msg:`Insufficient balance. Available: ${fmtCrypto(avail, dec)} ${asset}` }); return; }
    if (!address.trim() || address.trim().length < 10) {
      setFb({ t:"err", msg:"Enter a valid wallet address (min 10 characters)." }); return;
    }
    try {
      await mutation.mutateAsync({ asset, amount: n, address: address.trim(), network: meta.network || "" });
      setFb({ t:"ok", msg:`Withdrawal of ${n} ${asset} submitted. It will be processed shortly.` });
      setAmount(""); setAddress("");
    } catch (err) {
      setFb({ t:"err", msg: err?.message || "Withdrawal failed." });
    }
  };

  return (
    <div className="wp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wp-modal" role="dialog" aria-modal="true" aria-label="Withdraw">
        <div className="wp-modal-hdr">
          <div className="wp-modal-title">
            <span className="wp-modal-icon wp-modal-icon--wd"><i className="bi bi-arrow-up-circle-fill" /></span>
            Withdraw Crypto
          </div>
          <button className="wp-icon-btn" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>

        <div className="wp-modal-body">
          {fb && (
            <div className={`wp-alert wp-alert--${fb.t === "ok" ? "ok" : "err"}`}>
              <i className={`bi bi-${fb.t === "ok" ? "check-circle-fill" : "exclamation-circle-fill"}`} />
              {fb.msg}
            </div>
          )}
          <form onSubmit={submit} noValidate>
            <div className="wp-field">
              <label className="wp-flabel">Asset</label>
              <select className="wp-sel" value={asset} onChange={e => { setAsset(e.target.value); setFb(null); }}>
                {assets.map(a => <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>)}
              </select>
            </div>

            {meta.network && (
              <div className="wp-net-badge">
                <i className="bi bi-hdd-network" /> Network: <b>{meta.network}</b>
              </div>
            )}

            <div className="wp-field">
              <div className="wp-flabel-row">
                <label className="wp-flabel">Amount</label>
                <span className="wp-avail-hint">
                  Available: <b>{fmtCrypto(avail, dec)} {asset}</b>
                </span>
              </div>
              <div className="wp-inp-wrap">
                <input type="number" className="wp-inp" placeholder="0.00" min="0" step="any"
                  max={avail} value={amount} onChange={e => setAmount(e.target.value)} required />
                <button type="button" className="wp-max-btn" onClick={() => setAmount(String(avail))}>
                  MAX
                </button>
              </div>
            </div>

            <div className="wp-field">
              <label className="wp-flabel">Withdrawal Address</label>
              <input type="text" className="wp-inp"
                placeholder={`Your ${asset} address on ${meta.network || "the network"}`}
                value={address} onChange={e => setAddress(e.target.value)} required />
            </div>

            <div className="wp-notice wp-notice--warn">
              <i className="bi bi-exclamation-triangle-fill" />
              Double-check your address. Crypto transactions are irreversible.
            </div>

            <button type="submit" className="wp-submit wp-submit--wd" disabled={mutation.isPending}>
              {mutation.isPending
                ? <><i className="bi bi-hourglass-split" /> Submitting…</>
                : <><i className="bi bi-arrow-up-circle-fill" /> Withdraw {asset}</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Recent Activity ───────────────────────────────────────────────────────────

const RecentActivity = ({ assetMap }) => {
  const [filter, setFilter] = useState("");
  const [page,   setPage]   = useState(1);
  const params = useMemo(() => ({ page, limit: 10, ...(filter ? { type: filter } : {}) }), [page, filter]);
  const { data, isLoading } = useWalletTransactionsQuery(params, true);

  const txs   = data?.transactions ?? [];
  const total = data?.pages ?? 1;

  return (
    <div className="wp-activity-card">
      <div className="wp-card-head">
        <div className="wp-card-title">Recent Activity</div>
        <div className="wp-tab-row">
          {["","deposit","withdrawal","trade"].map(t => (
            <button
              key={t || "all"}
              className={`wp-tab${filter === t ? " wp-tab--on" : ""}`}
              onClick={() => { setFilter(t); setPage(1); }}
            >
              {t ? t.charAt(0).toUpperCase() + t.slice(1) : "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="wp-act-skeleton-list">
          {[1,2,3,4].map(i => <div key={i} className="wp-act-skel" />)}
        </div>
      ) : txs.length === 0 ? (
        <div className="wp-empty wp-empty--sm">
          <i className="bi bi-clock-history" />
          <div className="wp-empty-h">No transactions yet</div>
          <div className="wp-empty-sub">Your activity will appear here once you start trading.</div>
        </div>
      ) : (
        <>
          <div className="wp-table-wrap">
            <table className="wp-table wp-act-table">
              <thead>
                <tr>
                  <th className="wp-th">Type</th>
                  <th className="wp-th">Asset</th>
                  <th className="wp-th wp-th--r">Amount</th>
                  <th className="wp-th">Status</th>
                  <th className="wp-th wp-th--ref">Reference</th>
                  <th className="wp-th wp-th--r">Date</th>
                </tr>
              </thead>
              <tbody>
                {txs.map(tx => {
                  const dec      = assetMap[tx.asset]?.decimals ?? 6;
                  const isCredit = tx.type === "deposit" || tx.type === "trade_buy";
                  return (
                    <tr key={tx._id || tx.id} className="wp-row">
                      <td className="wp-td">
                        <span className={`wp-type-badge wp-type-badge--${tx.type}`}>
                          <i className={`bi bi-arrow-${isCredit ? "down" : "up"}-short`} />
                          {tx.type}
                        </span>
                      </td>
                      <td className="wp-td">
                        <div className="wp-tx-asset">
                          <CoinBadge symbol={tx.asset} size={24} />
                          <span className="wp-coin-sym">{tx.asset}</span>
                        </div>
                      </td>
                      <td className="wp-td wp-td--num">
                        <span style={{ color: isCredit ? "#0ecb81" : "#f6465d", fontVariantNumeric:"tabular-nums" }}>
                          {isCredit ? "+" : "−"}{Number(tx.amount || 0).toFixed(dec)}
                        </span>
                      </td>
                      <td className="wp-td">
                        <span className={`wp-status wp-status--${tx.status}`}>{tx.status}</span>
                      </td>
                      <td className="wp-td wp-td--ref">
                        <span className="wp-ref">{tx.reference || "—"}</span>
                      </td>
                      <td className="wp-td wp-td--num wp-td--date">{fmtDate(tx.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {total > 1 && (
            <div className="wp-pager">
              <button className="wp-pg-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <i className="bi bi-chevron-left" />
              </button>
              <span className="wp-pg-info">{page} / {total}</span>
              <button className="wp-pg-btn" disabled={page >= total} onClick={() => setPage(p => p + 1)}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const Wallet = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // ── ALL HOOKS BEFORE ANY CONDITIONAL RETURN ───────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hidden,      setHidden]      = useState(false);
  const [modal,       setModal]       = useState(null);

  const { data: wallets = [], isLoading: wLoading } = useMyWalletsQuery(true);
  const { data: assets  = [], isLoading: aLoading } = useSupportedAssets();
  const tickers = useLiveMarketStore(s => s.tickers);

  useWalletSocket({ enabled: true });
  useMarketSocket();

  const assetMap = useMemo(() => {
    const m = {};
    for (const a of assets) m[a.symbol] = a;
    return m;
  }, [assets]);

  // ── Auth guard (after all hooks) ─────────────────────────────────────────
  const tok = localStorage.getItem("token");
  let usr = null;
  try { const r = localStorage.getItem("user"); usr = r && r !== "null" ? JSON.parse(r) : null; } catch {}
  if (!isAuthenticated && !(tok && usr && typeof usr === "object")) {
    return <Navigate to="/login" replace />;
  }

  const loading = wLoading || aLoading;

  const openModal = (type, asset = null) => setModal({ type, asset });
  const closeModal = () => setModal(null);

  return (
    <div className="dash-root">
      <DashNavbar onMenuClick={() => setSidebarOpen(v => !v)} />

      <div className="dash-body">
        <DashSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={() => { useAuthStore.getState().logout(); navigate("/login"); }}
        />

        <main className="dash-main wp-page">
          <PortfolioCard
            wallets={wallets}
            assetMap={assetMap}
            tickers={tickers}
            loading={loading}
            hidden={hidden}
            onToggleHide={() => setHidden(v => !v)}
            onAction={type => openModal(type)}
          />

          <AssetsTable
            wallets={wallets}
            assetMap={assetMap}
            tickers={tickers}
            loading={loading}
            hidden={hidden}
            onDeposit={asset => openModal("deposit", asset)}
            onWithdraw={asset => openModal("withdraw", asset)}
          />

          <RecentActivity assetMap={assetMap} />
        </main>
      </div>

      {modal?.type === "deposit" && (
        <DepositModal
          initialAsset={modal.asset}
          assets={assets}
          onClose={closeModal}
        />
      )}
      {modal?.type === "withdraw" && (
        <WithdrawModal
          initialAsset={modal.asset}
          assets={assets}
          wallets={wallets}
          assetMap={assetMap}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Wallet;
