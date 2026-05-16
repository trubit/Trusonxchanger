import React from "react";

const TradeHeader = ({ ticker }) => {
  const isUp = ticker.change24h >= 0;

  return (
    <div className="tx-trade-header d-flex align-items-center gap-4 flex-wrap">
      <div className="tx-trade-header-symbol">
        <h2 className="mb-0">{ticker.symbol}</h2>
        <p className="mb-0 text-muted" style={{ fontSize: "0.75rem" }}>
          Spot Trading
        </p>
      </div>

      <div className="d-flex flex-column">
        <strong className={`tx-last-price ${isUp ? "tx-change-up" : "tx-change-down"}`}>
          {ticker.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </strong>
        <p className="mb-0">Last Price</p>
      </div>

      <div className="d-flex flex-column">
        <span className={`tx-change ${isUp ? "tx-change-up" : "tx-change-down"}`}>
          {isUp ? "+" : ""}{ticker.change24h}%
        </span>
        <p className="mb-0">24h Change</p>
      </div>

      <div className="d-flex flex-column">
        <strong>{ticker.high24h.toLocaleString()}</strong>
        <p className="mb-0">24h High</p>
      </div>

      <div className="d-flex flex-column">
        <strong>{ticker.low24h.toLocaleString()}</strong>
        <p className="mb-0">24h Low</p>
      </div>

      <div className="d-flex flex-column">
        <strong>{ticker.volumeQuote24h.toLocaleString()}</strong>
        <p className="mb-0">24h Volume (USDT)</p>
      </div>
    </div>
  );
};

export default TradeHeader;
