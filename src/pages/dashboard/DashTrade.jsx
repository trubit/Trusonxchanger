import { useState, useMemo } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  useCancelOrderMutation,
  useCreateOrderMutation,
  useOpenOrdersQuery,
  useOrderHistoryQuery,
} from "../../hooks/queries/useOrderQueries";
import { useOrderSocket } from "../../hooks/useOrderSocket";
import { useMyWalletsQuery } from "../../hooks/queries/useWalletQueries";
import { useSupportedAssets } from "../../hooks/queries/useAssetsQuery";
import { useLiveMarketStore } from "../../store/liveMarketStore";
import { useMarketSocket } from "../../hooks/useMarketSocket";
import DashNavbar from "../../Components/layout/DashNavbar";
import DashSidebar from "../../Components/dashboard/DashSidebar";
import "../../styles/dashboard.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

const USD = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD",
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const fmtUSD  = (n) => USD.format(n ?? 0);
const fmtN    = (n, d = 6) => Number.isFinite(+n) ? (+n).toFixed(d) : "—";
const fmtPct  = (n) => { const v = Number(n ?? 0); return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`; };
const fmtDate = (d) => {
  try { return new Date(d).toLocaleString([], { dateStyle: "short", timeStyle: "short" }); }
  catch { return "—"; }
};

const QUOTE_ASSETS = ["USDT", "BTC", "ETH"];
const STABLES      = new Set(["USDT", "USDC"]);

const STATUS_CFG = {
  open:             { color: "#0ecb81", bg: "rgba(14,203,129,0.12)",   label: "OPEN"             },
  partially_filled: { color: "#f0b90b", bg: "rgba(240,185,11,0.12)",   label: "PARTIAL"          },
  filled:           { color: "#636d77", bg: "rgba(99,109,119,0.12)",   label: "FILLED"           },
  cancelled:        { color: "#f6465d", bg: "rgba(246,70,93,0.12)",    label: "CANCELLED"        },
};

// ── Shared small components ───────────────────────────────────────────────────

const Shimmer = ({ h = 14, w = "100%", r = 5 }) => (
  <span className="db-shimmer" style={{ height: h, width: w, borderRadius: r, display: "block" }} />
);

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.cancelled;
  return (
    <span className="dt-status" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
};

const SideBadge = ({ side }) => (
  <span className={`dt-side dt-side--${side}`}>{(side || "—").toUpperCase()}</span>
);

// ── Pair Selector ─────────────────────────────────────────────────────────────

const PairSelector = ({ pairs, activeSymbol, onSelect }) => {
  const [q, setQ] = useState("");
  const [quoteFilter, setQuoteFilter] = useState("USDT");

  const filtered = useMemo(() => {
    const byQuote = pairs.filter(p => p.quote === quoteFilter);
    if (!q.trim()) return byQuote;
    const lq = q.toLowerCase();
    return byQuote.filter(p =>
      p.symbol.toLowerCase().includes(lq) || p.baseName?.toLowerCase().includes(lq)
    );
  }, [pairs, quoteFilter, q]);

  return (
    <div className="dt-pairs-panel">
      <div className="dt-pairs-head">
        <div className="dt-pairs-search">
          <i className="bi bi-search dt-pairs-ico" />
          <input
            className="dt-pairs-inp"
            placeholder="Search pair…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div className="dt-quote-tabs">
          {QUOTE_ASSETS.map(qa => (
            <button
              key={qa}
              className={`dt-qtab${quoteFilter === qa ? " dt-qtab--on" : ""}`}
              onClick={() => setQuoteFilter(qa)}
            >{qa}</button>
          ))}
        </div>
      </div>
      <div className="dt-pairs-list">
        {filtered.length === 0
          ? <div className="dt-pairs-empty">No pairs found</div>
          : filtered.map(p => (
            <button
              key={p.symbol}
              className={`dt-pair-item${activeSymbol === p.symbol ? " dt-pair-item--on" : ""}`}
              onClick={() => onSelect(p.symbol)}
            >
              <span className="dt-pair-sym">{p.base}<span className="dt-pair-q">/{p.quote}</span></span>
            </button>
          ))
        }
      </div>
    </div>
  );
};

// ── Ticker Bar ────────────────────────────────────────────────────────────────

const TickerBar = ({ symbol, tickers, assets }) => {
  const pair   = symbol.match(/^(.+?)(USDT|BTC|ETH)$/) || [];
  const base   = pair[1] || symbol.slice(0, -4);
  const quote  = pair[2] || symbol.slice(-4);
  const ticker = tickers?.[symbol] || {};
  const meta   = assets?.find?.(a => a.symbol === base) || {};

  const price     = ticker.lastPrice    || meta.price || 0;
  const change    = ticker.priceChangePct || 0;
  const high      = ticker.high24h      || 0;
  const low       = ticker.low24h       || 0;
  const vol       = ticker.volume24h    || ticker.quoteVolume24h || 0;
  const isUp      = Number(change) >= 0;

  return (
    <div className="dt-ticker">
      <div className="dt-ticker-pair">
        <span className="dt-ticker-sym">{base}</span>
        <span className="dt-ticker-q">/{quote}</span>
      </div>
      <div className="dt-ticker-price" style={{ color: isUp ? "#0ecb81" : "#f6465d" }}>
        {price ? fmtN(price, 2) : "—"}
      </div>
      <div className="dt-ticker-stat">
        <span className="dt-ticker-stat-label">24h Change</span>
        <span className={`dt-ticker-stat-val ${isUp ? "dt-up" : "dt-dn"}`}>{fmtPct(change)}</span>
      </div>
      <div className="dt-ticker-stat">
        <span className="dt-ticker-stat-label">24h High</span>
        <span className="dt-ticker-stat-val">{high ? fmtN(high, 2) : "—"}</span>
      </div>
      <div className="dt-ticker-stat">
        <span className="dt-ticker-stat-label">24h Low</span>
        <span className="dt-ticker-stat-val">{low ? fmtN(low, 2) : "—"}</span>
      </div>
      <div className="dt-ticker-stat dt-ticker-stat--hide-sm">
        <span className="dt-ticker-stat-label">24h Volume</span>
        <span className="dt-ticker-stat-val">{vol ? fmtN(vol, 2) : "—"} {quote}</span>
      </div>
    </div>
  );
};

// ── Order Form ────────────────────────────────────────────────────────────────

const OrderForm = ({ wallets, activeSymbol }) => {
  const pair = useMemo(() => {
    const m = activeSymbol.match(/^(.+?)(USDT|BTC|ETH)$/);
    return m ? { base: m[1], quote: m[2] } : { base: activeSymbol.slice(0, -4), quote: activeSymbol.slice(-4) };
  }, [activeSymbol]);

  const quoteWallet = wallets.find(w => w.asset === pair.quote);
  const baseWallet  = wallets.find(w => w.asset === pair.base);

  const [side,     setSide]     = useState("buy");
  const [price,    setPrice]    = useState("");
  const [amount,   setAmount]   = useState("");
  const [feedback, setFeedback] = useState(null);

  const mutation = useCreateOrderMutation();

  const availableQuote = quoteWallet?.available ?? 0;
  const availableBase  = baseWallet?.available  ?? 0;
  const available      = side === "buy" ? availableQuote : availableBase;
  const availAsset     = side === "buy" ? pair.quote     : pair.base;

  const numPrice  = parseFloat(price)  || 0;
  const numAmount = parseFloat(amount) || 0;
  const total     = numPrice * numAmount;

  const applyPct = (pct) => {
    if (side === "buy") {
      if (!numPrice) return;
      setAmount(fmtN((availableQuote * pct) / numPrice, 6));
    } else {
      setAmount(fmtN(availableBase * pct, 6));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    if (!numPrice  || numPrice  <= 0) { setFeedback({ t: "err", msg: "Enter a valid price."  }); return; }
    if (!numAmount || numAmount <= 0) { setFeedback({ t: "err", msg: "Enter a valid amount." }); return; }
    try {
      await mutation.mutateAsync({ symbol: activeSymbol, side, orderType: "limit", price: numPrice, amount: numAmount });
      setFeedback({ t: "ok", msg: `${side.toUpperCase()} order placed successfully.` });
      setPrice(""); setAmount("");
    } catch (err) {
      setFeedback({ t: "err", msg: err?.message || "Order failed. Please try again." });
    }
  };

  const isBuy = side === "buy";

  return (
    <div className="dt-form-card">
      {/* BUY / SELL tabs */}
      <div className="dt-side-tabs">
        <button
          className={`dt-side-tab${isBuy ? " dt-side-tab--buy" : ""}`}
          onClick={() => { setSide("buy"); setFeedback(null); setAmount(""); }}
        >BUY</button>
        <button
          className={`dt-side-tab${!isBuy ? " dt-side-tab--sell" : ""}`}
          onClick={() => { setSide("sell"); setFeedback(null); setAmount(""); }}
        >SELL</button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`dt-alert dt-alert--${feedback.t === "ok" ? "ok" : "err"}`}>
          <i className={`bi bi-${feedback.t === "ok" ? "check-circle-fill" : "exclamation-circle-fill"}`} />
          {feedback.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Order type label */}
        <div className="dt-type-row">
          <span className="dt-type-label">LIMIT ORDER</span>
        </div>

        {/* Price */}
        <div className="dt-field">
          <div className="dt-flabel-row">
            <label className="dt-flabel">Price</label>
            <span className="dt-flabel-unit">{pair.quote}</span>
          </div>
          <input
            type="number" className="dt-inp"
            placeholder="0.00" min="0" step="any"
            value={price} onChange={e => { setPrice(e.target.value); setFeedback(null); }}
          />
        </div>

        {/* Amount */}
        <div className="dt-field">
          <div className="dt-flabel-row">
            <label className="dt-flabel">Amount</label>
            <span className="dt-flabel-unit">{pair.base}</span>
          </div>
          <input
            type="number" className="dt-inp"
            placeholder="0.00000000" min="0" step="any"
            value={amount} onChange={e => { setAmount(e.target.value); setFeedback(null); }}
          />
        </div>

        {/* Percentage buttons */}
        <div className="dt-pct-row">
          {[0.25, 0.5, 0.75, 1].map((p, i) => (
            <button key={i} type="button" className="dt-pct-btn" onClick={() => applyPct(p)}>
              {p === 1 ? "MAX" : `${p * 100}%`}
            </button>
          ))}
        </div>

        {/* Available + Total */}
        <div className="dt-form-info">
          <div className="dt-form-info-row">
            <span className="dt-form-info-label">Available</span>
            <span className="dt-form-info-val">
              <b>{fmtN(available, 4)}</b> {availAsset}
            </span>
          </div>
          {total > 0 && (
            <div className="dt-form-info-row">
              <span className="dt-form-info-label">Est. Total</span>
              <span className="dt-form-info-val"><b>{fmtN(total, 4)}</b> {pair.quote}</span>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={`dt-submit dt-submit--${side}`}
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? <><i className="bi bi-hourglass-split" /> Placing…</>
            : <>{isBuy ? "BUY" : "SELL"} {pair.base}</>}
        </button>
      </form>
    </div>
  );
};

// ── Open Orders ───────────────────────────────────────────────────────────────

const OpenOrders = ({ symbol }) => {
  const { data: orders = [], isLoading } = useOpenOrdersQuery(symbol ? { symbol } : {}, true);
  const cancelMutation = useCancelOrderMutation();
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (id) => {
    setCancellingId(id);
    try { await cancelMutation.mutateAsync(id); } catch {}
    finally { setCancellingId(null); }
  };

  return (
    <div className="dt-section">
      <div className="dt-section-head">
        <div className="dt-section-title">
          Open Orders
          {orders.length > 0 && <span className="dt-badge">{orders.length}</span>}
        </div>
      </div>

      {isLoading ? (
        <div className="dt-skel-list">
          {[1,2].map(i => <Shimmer key={i} h={44} r={6} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="dt-empty">
          <i className="bi bi-inbox" />
          <div className="dt-empty-h">No open orders</div>
          <div className="dt-empty-sub">Your active orders will appear here.</div>
        </div>
      ) : (
        <div className="dt-table-wrap">
          <table className="dt-table">
            <thead>
              <tr>
                <th className="dt-th">Pair</th>
                <th className="dt-th">Side</th>
                <th className="dt-th">Type</th>
                <th className="dt-th dt-th--r">Price</th>
                <th className="dt-th dt-th--r">Amount</th>
                <th className="dt-th dt-th--r">Filled</th>
                <th className="dt-th">Status</th>
                <th className="dt-th">Date</th>
                <th className="dt-th dt-th--r">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id || o.id} className="dt-row">
                  <td className="dt-td dt-td--pair">{o.symbol}</td>
                  <td className="dt-td"><SideBadge side={o.side} /></td>
                  <td className="dt-td dt-td--type">{o.orderType?.toUpperCase()}</td>
                  <td className="dt-td dt-td--r dt-td--num">{fmtN(o.price, 2)}</td>
                  <td className="dt-td dt-td--r dt-td--num">{fmtN(o.amount, 6)}</td>
                  <td className="dt-td dt-td--r dt-td--muted">{fmtN(o.filledAmount, 6)}</td>
                  <td className="dt-td"><StatusBadge status={o.status} /></td>
                  <td className="dt-td dt-td--date">{fmtDate(o.createdAt)}</td>
                  <td className="dt-td dt-td--r">
                    <button
                      className="dt-cancel-btn"
                      onClick={() => handleCancel(o._id || o.id)}
                      disabled={cancellingId === (o._id || o.id)}
                    >
                      {cancellingId === (o._id || o.id) ? "…" : "Cancel"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Order History ─────────────────────────────────────────────────────────────

const OrderHistory = ({ symbol }) => {
  const [page,       setPage]       = useState(1);
  const [sideFilter, setSideFilter] = useState("");
  const params = { page, limit: 10, ...(symbol ? { symbol } : {}), ...(sideFilter ? { side: sideFilter } : {}) };
  const { data, isLoading } = useOrderHistoryQuery(params, true);

  const orders = data?.orders ?? [];
  const pages  = data?.pages  ?? 1;

  return (
    <div className="dt-section">
      <div className="dt-section-head">
        <div className="dt-section-title">Order History</div>
        <div className="dt-filter-row">
          {["", "buy", "sell"].map(s => (
            <button
              key={s || "all"}
              className={`dt-ftab${sideFilter === s ? " dt-ftab--on" : ""}`}
              onClick={() => { setSideFilter(s); setPage(1); }}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="dt-skel-list">
          {[1,2,3].map(i => <Shimmer key={i} h={44} r={6} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="dt-empty">
          <i className="bi bi-clock-history" />
          <div className="dt-empty-h">No order history yet</div>
          <div className="dt-empty-sub">Completed and cancelled orders will appear here.</div>
        </div>
      ) : (
        <>
          <div className="dt-table-wrap">
            <table className="dt-table">
              <thead>
                <tr>
                  <th className="dt-th">Pair</th>
                  <th className="dt-th">Side</th>
                  <th className="dt-th">Type</th>
                  <th className="dt-th dt-th--r">Price</th>
                  <th className="dt-th dt-th--r">Amount</th>
                  <th className="dt-th dt-th--r">Avg Fill</th>
                  <th className="dt-th">Status</th>
                  <th className="dt-th">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id || o.id} className="dt-row">
                    <td className="dt-td dt-td--pair">{o.symbol}</td>
                    <td className="dt-td"><SideBadge side={o.side} /></td>
                    <td className="dt-td dt-td--type">{o.orderType?.toUpperCase()}</td>
                    <td className="dt-td dt-td--r dt-td--num">{fmtN(o.price, 2)}</td>
                    <td className="dt-td dt-td--r dt-td--num">{fmtN(o.amount, 6)}</td>
                    <td className="dt-td dt-td--r dt-td--muted">
                      {o.averagePrice > 0 ? fmtN(o.averagePrice, 2) : "—"}
                    </td>
                    <td className="dt-td"><StatusBadge status={o.status} /></td>
                    <td className="dt-td dt-td--date">{fmtDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="dt-pager">
              <button className="dt-pg-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <i className="bi bi-chevron-left" />
              </button>
              <span className="dt-pg-info">{page} / {pages}</span>
              <button className="dt-pg-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Main DashTrade Page ───────────────────────────────────────────────────────

const DashTrade = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // ── ALL HOOKS BEFORE CONDITIONAL RETURN ──────────────────────────────────
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [activeSymbol,  setActiveSymbol]  = useState("BTCUSDT");

  const { data: wallets = [] } = useMyWalletsQuery(true);
  const { data: assets  = [] } = useSupportedAssets();
  const tickers = useLiveMarketStore(s => s.tickers);

  useOrderSocket({ enabled: isAuthenticated });
  useMarketSocket();

  // Build trading pairs from supported assets
  const pairs = useMemo(() => {
    const list = [];
    for (const a of assets) {
      if (STABLES.has(a.symbol)) continue;
      for (const q of QUOTE_ASSETS) {
        if (a.symbol === q) continue;
        if (!assets.find(x => x.symbol === q)) continue;
        list.push({ symbol: `${a.symbol}${q}`, base: a.symbol, quote: q, baseName: a.name });
      }
    }
    // Sort: USDT pairs first, then BTC, then ETH; alphabetical within each group
    list.sort((a, b) => {
      const qi = QUOTE_ASSETS.indexOf;
      const qa = QUOTE_ASSETS.indexOf(a.quote);
      const qb = QUOTE_ASSETS.indexOf(b.quote);
      if (qa !== qb) return qa - qb;
      return a.base.localeCompare(b.base);
    });
    return list;
  }, [assets]);

  // ── Auth guard ────────────────────────────────────────────────────────────
  const tok = localStorage.getItem("token");
  let usr = null;
  try { const r = localStorage.getItem("user"); usr = r && r !== "null" ? JSON.parse(r) : null; } catch {}
  if (!isAuthenticated && !(tok && usr && typeof usr === "object")) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dash-root">
      <DashNavbar onMenuClick={() => setSidebarOpen(v => !v)} />

      <div className="dash-body">
        <DashSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={() => { useAuthStore.getState().logout(); navigate("/login"); }}
        />

        <main className="dash-main dt-page">

          {/* Page header */}
          <div className="dt-page-head">
            <div className="dt-page-head-left">
              <h1 className="dt-page-title">Spot Trading</h1>
              <p className="dt-page-sub">Limit orders — funds are locked until the order fills or is cancelled.</p>
            </div>
            <div className="dt-page-head-right">
              <Link to="/trade" className="dt-adv-link">
                <i className="bi bi-graph-up-arrow" /> Advanced Chart
              </Link>
            </div>
          </div>

          {/* Ticker bar */}
          <TickerBar symbol={activeSymbol} tickers={tickers} assets={assets} />

          {/* Main content */}
          <div className="dt-layout">

            {/* Left column — pairs + form */}
            <div className="dt-left-col">
              <PairSelector
                pairs={pairs}
                activeSymbol={activeSymbol}
                onSelect={setActiveSymbol}
              />
              <OrderForm wallets={wallets} activeSymbol={activeSymbol} />
            </div>

            {/* Right column — orders */}
            <div className="dt-right-col">
              <OpenOrders  symbol={activeSymbol} />
              <OrderHistory symbol={activeSymbol} />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default DashTrade;
