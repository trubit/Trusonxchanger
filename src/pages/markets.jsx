import { useEffect, useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Container, Table, Form, InputGroup, Badge, Spinner } from "react-bootstrap";
import { useAuthStore } from "../store/authStore";
import { useMarketSummary } from "../hooks/useMarketData.js";
import { useMarketSocket } from "../hooks/useMarketSocket.js";
import { useLiveMarketStore } from "../store/liveMarketStore.js";
import DashNavbar from "../Components/layout/DashNavbar";
import DashSidebar from "../Components/dashboard/DashSidebar";
import "../styles/markets.css";
import "../styles/dashboard.css";

// ── Constants ─────────────────────────────────────────────────────────────────

const QUOTE_ASSETS = ["USDT", "BTC", "ETH"];
const QUOTE_RE     = new RegExp(`(${QUOTE_ASSETS.join("|")})$`);

// ── Formatting helpers ─────────────────────────────────────────────────────────

const fmt = {
  price: (n) => {
    if (n == null) return "—";
    if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (n >= 1)    return n.toFixed(4);
    return n.toFixed(8);
  },
  pct: (n) => {
    if (n == null) return "—";
    return `${n >= 0 ? "+" : ""}${Number(n).toFixed(2)}%`;
  },
  vol: (n) => {
    if (n == null) return "—";
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
    return Number(n).toFixed(4);
  },
};

// ── Ticker row ─────────────────────────────────────────────────────────────────

const TickerRow = ({ ticker, onTrade }) => {
  const isUp = (ticker.priceChangePct ?? 0) >= 0;
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    setFlash(isUp ? "flash-green" : "flash-red");
    const t = setTimeout(() => setFlash(null), 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker.lastPrice]);

  const m          = ticker.symbol.match(QUOTE_RE);
  const quoteAsset = m ? m[1] : "";
  const baseAsset  = quoteAsset ? ticker.symbol.slice(0, -quoteAsset.length) : ticker.symbol;

  return (
    <tr className={flash ? `ticker-row ${flash}` : "ticker-row"}>
      <td>
        <div className="d-flex align-items-center gap-2">
          <div className="tx-asset-icon">{baseAsset[0]}</div>
          <div>
            <span className="fw-semibold">{baseAsset}</span>
            <span className="tx-quote text-muted">/{quoteAsset}</span>
          </div>
        </div>
      </td>
      <td className="text-end fw-semibold">
        ${fmt.price(ticker.lastPrice)}
      </td>
      <td className={`text-end fw-semibold ${isUp ? "tx-up" : "tx-down"}`}>
        {fmt.pct(ticker.priceChangePct)}
      </td>
      <td className="text-end text-muted d-none d-md-table-cell">
        ${fmt.price(ticker.high24h)}
      </td>
      <td className="text-end text-muted d-none d-md-table-cell">
        ${fmt.price(ticker.low24h)}
      </td>
      <td className="text-end text-muted d-none d-lg-table-cell">
        {fmt.vol(ticker.volume24h)} {baseAsset}
      </td>
      <td className="text-end">
        <button
          className="btn btn-sm tx-trade-btn"
          onClick={() => onTrade(ticker.symbol)}
        >
          Trade
        </button>
      </td>
    </tr>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const Markets = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // ── All hooks before conditional return ───────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search,      setSearch]      = useState("");
  const [sortKey,     setSortKey]     = useState("volume24h");
  const [sortDir,     setSortDir]     = useState(-1);

  useMarketSocket();

  const { tickers: liveTickers, connected } = useLiveMarketStore();
  const { data, isLoading }  = useMarketSummary();
  const setAllTickers = useLiveMarketStore((s) => s.setAllTickers);

  useEffect(() => {
    if (data?.tickers?.length) setAllTickers(data.tickers);
  }, [data, setAllTickers]);

  const rows = useMemo(() => {
    const list   = Object.values(liveTickers);
    const term   = search.toLowerCase();
    const filtered = term ? list.filter((t) => t.symbol.toLowerCase().includes(term)) : list;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir * (bv - av);
    });
  }, [liveTickers, search, sortKey, sortDir]);

  // ── Auth guard ────────────────────────────────────────────────────────────
  const tok = localStorage.getItem("token");
  let usr = null;
  try { const r = localStorage.getItem("user"); usr = r && r !== "null" ? JSON.parse(r) : null; } catch {}
  if (!isAuthenticated && !(tok && usr && typeof usr === "object")) {
    return <Navigate to="/login" replace />;
  }

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => -d);
    else { setSortKey(key); setSortDir(-1); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="tx-sort-icon text-muted">⇅</span>;
    return <span className="tx-sort-icon">{sortDir === -1 ? "↓" : "↑"}</span>;
  };

  return (
    <div className="dash-root">
      <DashNavbar onMenuClick={() => setSidebarOpen(v => !v)} />

      <div className="dash-body">
        <DashSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={() => { useAuthStore.getState().logout(); navigate("/login"); }}
        />

        <main className="dash-main tx-markets-page">
          <Container fluid className="py-4">

            {/* ── Header ── */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div>
                <h1 className="tx-markets-title mb-1">Markets</h1>
                <p className="tx-markets-sub text-muted mb-0">
                  Live prices from executed trades on TrusonXchanger
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Badge bg={connected ? "success" : "secondary"} className="tx-live-badge">
                  {connected ? "● LIVE" : "○ Connecting…"}
                </Badge>
              </div>
            </div>

            {/* ── Search ── */}
            <div className="mb-3" style={{ maxWidth: 320 }}>
              <InputGroup size="sm">
                <InputGroup.Text className="tx-search-icon">⌕</InputGroup.Text>
                <Form.Control
                  placeholder="Search pairs (BTC, ETH…)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="tx-search-input"
                />
              </InputGroup>
            </div>

            {/* ── Loading / empty states ── */}
            {isLoading && !rows.length && (
              <div className="text-center py-5">
                <Spinner animation="border" size="sm" className="me-2" />
                Loading market data…
              </div>
            )}

            {!isLoading && !rows.length && (
              <div className="tx-empty-state text-center py-5">
                <div className="tx-empty-icon">📈</div>
                <h5 className="mt-3">No market data yet</h5>
                <p className="text-muted">
                  Market data populates as trades are executed on the exchange.
                  <br />
                  Place a trade to see live prices appear here.
                </p>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => navigate("/Dashboard/trade")}
                >
                  Go to Trade
                </button>
              </div>
            )}

            {/* ── Table ── */}
            {rows.length > 0 && (
              <div className="tx-markets-table-wrap">
                <Table hover responsive className="tx-markets-table mb-0">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th
                        className="text-end tx-sortable"
                        onClick={() => handleSort("lastPrice")}
                      >
                        Price <SortIcon col="lastPrice" />
                      </th>
                      <th
                        className="text-end tx-sortable"
                        onClick={() => handleSort("priceChangePct")}
                      >
                        24h Change <SortIcon col="priceChangePct" />
                      </th>
                      <th className="text-end d-none d-md-table-cell">24h High</th>
                      <th className="text-end d-none d-md-table-cell">24h Low</th>
                      <th
                        className="text-end d-none d-lg-table-cell tx-sortable"
                        onClick={() => handleSort("volume24h")}
                      >
                        24h Volume <SortIcon col="volume24h" />
                      </th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((ticker) => (
                      <TickerRow
                        key={ticker.symbol}
                        ticker={ticker}
                        onTrade={(symbol) => navigate(`/Dashboard/trade?pair=${symbol}`)}
                      />
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            <p className="text-muted mt-3" style={{ fontSize: "0.75rem" }}>
              Prices update in real-time from matched trades. Data reflects the last 24 hours of trading activity.
            </p>
          </Container>
        </main>
      </div>
    </div>
  );
};

export default Markets;
